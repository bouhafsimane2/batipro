import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import Toaster from './components/toast/Toaster';
import NotFound from './notFound/NotFound';

// Site public
import Home from './home/Home';
import Marketplace from './marketplace/Marketplace';
import Offers from './offers/Offers';
import { Profils } from './profils/profils';
import { My_Profils as ProfessionalPage } from './my_profils/my_profils';
import HireInfo from './hireInfor/hireInfor';
import Recrutement from './recrutement/Recrutement';

// Compte utilisateur
import Login from './login/Login';
import Register from './register/Register';
import Panier from './panier/Panier';
import Cartafterdone from './cartafterdone/Cartafterdone';
import Favoris from './favoris/Favoris';
import Messages from './messages/Messages';
import Account from './account/Account';

// Espace admin
import Dashboard from './adimnComponents/dashboard/Dashboard';
import Profiles from './adimnComponents/profiles/Profiles';
import { ConstructersProfil } from './admin/ConstructersProfil/ConstructersProfil';
import { Marketowner } from './admin/Marketowner/Marketowner';
import Demands from './adimnComponents/demands/Demands';
import { Demmande } from './admin/demmande/demande';
import Products from './adimnComponents/products/Products';
import Addproduct from './adimnComponents/addProduct/Addproduct';
import AdminOffers from './adimnComponents/offers/AdminOffers';
import Command from './adimnComponents/commands/Command';
import Displayorder from './adimnComponents/displayorder/Displayorder';
import { ProffesionalProfils } from './admin/Proffesional_profils/ProffesionalProfils';

// Revient en haut de page à chaque changement de route (sauf ancres #section)
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Site public */}
          <Route path="/" element={<Home />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/profils" element={<Profils />} />
          <Route path="/my_profils" element={<ProfessionalPage />} />
          <Route path="/hireInfo" element={<HireInfo />} />
          <Route path="/recrutement" element={<Recrutement />} />

          {/* Compte utilisateur */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/panier" element={<Panier />} />
          <Route path="/Cartdone" element={<Cartafterdone />} />
          <Route path="/favoris" element={<Favoris />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/compte" element={<Account />} />

          {/* Espace admin (protégé par AdminLayout) */}
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/profiles" element={<Profiles />} />
          <Route path="/ConstructersProfil" element={<ConstructersProfil />} />
          <Route path="/Marketowner" element={<Marketowner />} />
          <Route path="/demands" element={<Demands />} />
          <Route path="/admin_demmande" element={<Demmande />} />
          <Route path="/products" element={<Products />} />
          <Route path="/addProduct" element={<Addproduct />} />
          <Route path="/adminOffers" element={<AdminOffers />} />
          <Route path="/commands" element={<Command />} />
          <Route path="/displayOrder" element={<Displayorder />} />
          <Route path="/ProffesionalProfils" element={<ProffesionalProfils />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;
