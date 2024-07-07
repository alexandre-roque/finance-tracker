'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { userSettings } from '@/db/schema/finance';

export async function EditUser({
	avatarLink,
	name,
	excludeProfileImage,
}: {
	avatarLink: string;
	name: string;
	excludeProfileImage: boolean;
}) {
	if (!excludeProfileImage && avatarLink) {
		if (!isValidUrl(avatarLink)) {
			return { error: 'URL inválida' };
		}

		if (avatarLink.includes('data:image')) {
			return { error: 'Links com base64 não são suportados' };
		}
	}

	const session = await auth();
	if (!session || !session.user || !session.user.id) {
		redirect('/sign-in');
	}

	const userId = session.user.id;
	const [updatedUser] = await db
		.update(users)
		.set({
			image: excludeProfileImage ? null : avatarLink ?? session.user.image,
			name: name ? name : session.user.name,
		})
		.where(eq(users.id, userId))
		.returning({ name: users.name, image: users.image });

	return { success: { name: updatedUser.name, image: updatedUser.image } };
}

export async function EditUserSettings({
	disableAnimations,
	hideMoney,
}: {
	disableAnimations: boolean;
	hideMoney: boolean;
}) {
	const session = await auth();
	if (!session || !session.user || !session.user.id) {
		redirect('/sign-in');
	}

	const userId = session.user.id;
	try {
		await db
			.update(userSettings)
			.set({
				disableAnimations,
				hideMoney,
			})
			.where(eq(userSettings.userId, userId));
	} catch (error) {
		return { error: `Erro ao editar configurações do usuário: ${error}}` };
	}

	return { success: true };
}

function isValidUrl(str: string) {
	try {
		new URL(str);
		return true;
	} catch (err) {
		return false;
	}
}

type GetSignedURLParams = {
	fileType: string;
	fileSize: number;
	checksum: string;
};

type SignedURLResponse = Promise<
	{ failure?: undefined; success: { url: string } } | { failure: string; success?: undefined }
>;

const allowedFileTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const maxFileSize = 1024 * 1024 * 10; // 10MB

const s3Client = new S3Client({
	region: process.env.AWS_BUCKET_REGION!,
	credentials: {
		accessKeyId: process.env.AWS_D_ACCESS_KEY!,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
	},
});

export const getSignedURL = async ({
	fileType,
	fileSize,
	checksum,
}: GetSignedURLParams): Promise<SignedURLResponse> => {
	const session = await auth();

	if (!session || !session.user || !session.user.id) {
		redirect('/sign-in');
	}

	if (!allowedFileTypes.includes(fileType)) {
		return { failure: 'Tipo de arquivo não autorizado' };
	}

	if (fileSize > maxFileSize) {
		return { failure: 'Arquivo muito grande, o tamanho máximo é 10 MB' };
	}

	const putObjectCommand = new PutObjectCommand({
		Bucket: process.env.AWS_BUCKET_NAME!,
		Key: `profile-pictures/profile-picture-${session.user.id}`,
		ContentType: fileType,
		ContentLength: fileSize,
		ChecksumSHA256: checksum,
		Metadata: {
			userId: session.user.id,
		},
	});

	const url = await getSignedUrl(
		s3Client,
		putObjectCommand,
		{ expiresIn: 60 } // 60 seconds
	);

	return { success: { url } };
};
