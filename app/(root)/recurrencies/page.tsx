'use client';

import RecurrenciesTable from '@/components/RecurrenciesTable';
import React from 'react';

function RecurrenciesPage() {
	return (
		<>
			<div className='border-b bg-card'>
				<div className='container flex flex-wrap items-center justify-between gap-6 py-8'>
					<div>
						<p className='text-3xl font-bold'>Gerenciar transações recorrentes</p>
					</div>
				</div>
			</div>
			<div className='container'>
				<RecurrenciesTable />
			</div>
		</>
	);
}

export default RecurrenciesPage;
