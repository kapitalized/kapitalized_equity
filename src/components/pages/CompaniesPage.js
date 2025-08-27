import React from 'react';
// Note: You will need to move the SortableTable component to its own file
// in src/components/ui/ to use it here properly.
// import SortableTable from '../ui/SortableTable';

const CompaniesPage = ({ companies }) => {
    // const companyColumns = [ ... ]; // Define columns for the table here

    return (
         <div>
            <h2 className="text-2xl font-bold mb-4">Companies</h2>
            <p className="mb-4">This page will list all your companies. You can manage them from here.</p>
            <div className="bg-white p-4 rounded-lg shadow">
                <ul>
                    {companies.map(company => (
                        <li key={company.id} className="border-b py-2">
                            <p className="font-bold">{company.name}</p>
                            <p className="text-sm text-gray-600">{company.description}</p>
                        </li>
                    ))}
                </ul>
                {/* <SortableTable data={companies} columns={companyColumns} /> */}
            </div>
        </div>
    );
};

export default CompaniesPage;
