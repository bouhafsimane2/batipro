import React, { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Navbar } from '../components/navbar/navbar'
import { Footer } from '../components/footer/footer'
import ContactForm from '../components/contactForm/ContactForm'
import { toast } from '../components/toast/Toaster'
import api, { apiError, isLoggedIn } from '../api/client';


// Demande d'embauche d'un professionnel : /hireInfo?id=12
export default function HireInfo() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const prof_id = searchParams.get('id');
    const [pro, setPro] = useState(null);

    useEffect(() => {
        if (!prof_id) return;
        api.get(`/professionals/${prof_id}/`).then((res) => setPro(res.data)).catch(() => {});
    }, [prof_id]);

    if (!isLoggedIn()) return <Navigate to='/login' replace />;
    if (!prof_id) return <Navigate to='/profils' replace />;

    const handleSubmit = async (values) => {
        try {
            await api.post('/order', { ...values, prof_id });
            toast("Demande envoyée ! Le professionnel vous recontactera.", 'success');
            navigate(`/my_profils?id=${prof_id}`);
        } catch (error) {
            toast(apiError(error, "La demande n'a pas pu être envoyée"), 'error');
        }
    }

  return (
    <div className='page'>
        <Navbar/>
        <main className='narrow'>
            <Link to={`/my_profils?id=${prof_id}`} className='back-link'>← Retour au profil</Link>
            <h1 className='page-title'>
                Embaucher {pro ? `${pro.client.first_name} ${pro.client.last_name}` : 'ce professionnel'}
            </h1>
            <p className='page-subtitle'>Décrivez votre besoin : le professionnel recevra votre demande avec vos coordonnées.</p>
            <section className='surface form-card'>
                <ContactForm
                    submitLabel='Envoyer la demande'
                    notePlaceholder='Ex. : extension de 30 m² à Bouira, début des travaux en mai…'
                    onSubmit={handleSubmit}
                />
            </section>
        </main>
        <Footer/>
    </div>
  )
}
