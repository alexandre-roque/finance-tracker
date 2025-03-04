'use client';

import MacrosTable from '@/components/transaction/MacrosTable';
import React from 'react';

function Macro() {
	return (
		<>
			<div className='border-b bg-card'>
				<div className='container flex flex-wrap items-center justify-between gap-6 py-8'>
					<div>
						<p className='text-3xl font-bold'>Gerenciar macros</p>
					</div>
				</div>
			</div>
			<div className='container'>
				<MacrosTable />
			</div>
		</>
	);
}

export default Macro;
