import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../admin/components/AdminLayout';
import ProductForm from '../editcard/Editcard';

// Page « Ajouter un produit » : même formulaire que la fenêtre d'édition
export default function Addproduct() {
    const navigate = useNavigate();
    return (
        <AdminLayout title="Ajouter un produit" back={{ to: '/products', label: 'Produits' }}>
            <section className="surface form-card admin-form">
                <ProductForm onCancel={() => navigate('/products')} onSaved={() => navigate('/products')} />
            </section>
        </AdminLayout>
    );
}
