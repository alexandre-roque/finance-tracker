import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: 'Finance Tracker',
		short_name: 'Tracker',
		description: 'Um aplicativo para te ajudar com suas finanças!',
		start_url: '/',
		display: 'standalone',
		icons: [
			{
				src: '/icon-192.png',
				sizes: '192x192',
				type: 'image/png',
			},
			{
				src: '/icon-512.png',
				sizes: '512x512',
				type: 'image/png',
			},
		],
	};
}
