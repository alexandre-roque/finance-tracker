import { auth } from '@/auth';
import Overview from '@/components/common/Overview';
import History from '@/components/common/History';
import { db } from '@/db';
import { userSettings } from '@/db/schema/finance';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import React from 'react';

const Analytics = async () => {
	const session = await auth();
	if (!session || !session.user || !session.user.id) {
		redirect('/sign-in');
	}

	return (
		<div>
			<Overview />
			<History />
		</div>
	);
};

export default Analytics;
