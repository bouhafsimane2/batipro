import React from "react";
import AdminLayout from "../components/AdminLayout";
import ProfileForm from "../../account/ProfileForm";

// Profil de l'administrateur connecté : /ProffesionalProfils
export function ProffesionalProfils() {
    return (
        <AdminLayout title="Mon profil">
            <div className="admin-form">
                <ProfileForm />
            </div>
        </AdminLayout>
    );
};
