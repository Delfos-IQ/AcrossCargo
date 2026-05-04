import React from 'react';
import CrudPage from '../../components/CrudPage.jsx';
import Layout from '../../components/Layout.jsx';

const GHA_TYPE_OPTIONS = [
  { value: 'export',      label: 'Export' },
  { value: 'import',      label: 'Import' },
  { value: 'supervisors', label: 'Supervisors' },
];

const FIELDS = [
  { key: 'name',       label: 'GHA Name',                    required: true,  transform: v => v.toUpperCase() },
  { key: 'ghaId',      label: 'GHA ID',                      required: true,  transform: v => v.toUpperCase(), placeholder: 'Unique identifier', editDisabled: true },
  { key: 'shortName',  label: 'Short Name',                  required: true,  transform: v => v.toUpperCase(), maxLength: 10, placeholder: 'e.g. PTW' },
  { key: 'type',       label: 'Type',                        required: true,  type: 'select', options: GHA_TYPE_OPTIONS, placeholder: 'Select type' },
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
  { label: 'Type',     key: 'type', render: item => item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : '—' },
  { label: 'Location', key: 'location' },
  { label: 'E-mail',   key: 'email' },
];

const INITIAL = {
  name: '', ghaId: '', shortName: '', type: '', location: '',
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
