import React from 'react';
import CrudPage from '../../components/CrudPage.jsx';
import Layout from '../../components/Layout.jsx';

const FIELDS = [
  { key: 'name',       label: 'GHA Name',                    required: true,  transform: v => v.toUpperCase() },
  { key: 'ghaId',      label: 'GHA ID',                      required: true,  transform: v => v.toUpperCase(), placeholder: 'Unique identifier', editDisabled: true },
  { key: 'shortName',  label: 'Short Name',                  required: true,  transform: v => v.toUpperCase(), maxLength: 10, placeholder: 'e.g. PTW' },
  { key: 'location',   label: 'Location (IATA code)',        required: true,  transform: v => v.toUpperCase(), placeholder: 'e.g. LIS' },
  { key: 'address',    label: 'Address',                     required: false, placeholder: 'Street and number' },
  { key: 'city',       label: 'City',                        required: false, placeholder: 'City' },
  { key: 'phone',      label: 'Phone',                       required: false, type: 'tel', placeholder: '+351 ...' },
  { key: 'email',      label: 'Email',                       required: false, type: 'email', placeholder: 'contact@gha.com' },
  { key: 'sitaNumber', label: 'SITA Number',                 required: false, transform: v => v.toUpperCase(), placeholder: 'e.g. LISPT7X' },
  { key: 'vatNumber',  label: 'VAT Number',                  required: false, placeholder: 'Tax ID / NIF' },
];

const COLUMNS = [
  { label: 'Name',     key: 'name' },
  { label: 'Short',    key: 'shortName' },
  { label: 'Location', key: 'location' },
  { label: 'E-mail',   key: 'email' },
];

const INITIAL = {
  name: '', ghaId: '', shortName: '', location: '',
  address: '', city: '', phone: '', email: '',
  sitaNumber: '', vatNumber: '',
};

export default function GhaPage() {
  return (
    <Layout>
      <CrudPage
        title="Ground Handling Agents (GHA)"
        collectionName="ghaProfiles"
        initialFormData={INITIAL}
        fields={FIELDS}
        listColumns={COLUMNS}
        searchKeys={['name', 'shortName', 'location', 'email', 'ghaId']}
        uniqueKey="ghaId"
        sortFn={(a, b) => (a.name || '').localeCompare(b.name || '')}
      />
    </Layout>
  );
}
