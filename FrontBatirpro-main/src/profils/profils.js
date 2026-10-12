import { useEffect, useState } from "react";
import api, { apiError } from "../api/client";
import { Navbar } from "../components/navbar/navbar"
import { Footer } from "../components/footer/footer"
import { CardH } from "../components/home_card/card"
import { SearchIcon } from "../components/icons/Icons"


export function Profils() {
    const [cardData, setCardData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [nom, setNom] = useState("");
    const [localisation, setLocalisation] = useState("");
    const [metiers, setMetiers] = useState([]); // Liste des métiers disponibles
    const [selectedMetier, setSelectedMetier] = useState(""); // Métier choisi
    const [searched, setSearched] = useState(false);

    const fetchProfiles = async (params) => {
        setLoading(true);
        try {
            const response = params
                ? await api.get("/professionals/search/", { params })
                : await api.get("/professionals/");
            setCardData(response.data);
            setError('');
        } catch (err) {
            setError(apiError(err, 'Impossible de charger les profils.'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfiles();
        api.get("/metiers/").then((res) => setMetiers(res.data)).catch(() => {});
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        setSearched(true);
        fetchProfiles({ nom: nom.trim(), localisation: localisation.trim(), metiers: selectedMetier });
    };

    const handleReset = () => {
        setNom('');
        setLocalisation('');
        setSelectedMetier('');
        setSearched(false);
        fetchProfiles();
    };

    return(
        <div className="page">
            <Navbar/>
            <main>
                <h1 className="page-title">Trouvez un professionnel</h1>
                <p className="page-subtitle">Maçons, plombiers, architectes… des artisans vérifiés près de chez vous.</p>

                <form className="search-panel" onSubmit={handleSearch}>
                    <div className="field">
                        <label htmlFor="search-nom">Nom</label>
                        <input id="search-nom" className="input" type="text" value={nom}
                            onChange={(e) => setNom(e.target.value)} placeholder="Ex. Karim" />
                    </div>
                    <div className="field">
                        <label htmlFor="search-loc">Localisation</label>
                        <input id="search-loc" className="input" type="text" value={localisation}
                            onChange={(e) => setLocalisation(e.target.value)} placeholder="Ex. Bejaia" />
                    </div>
                    <div className="field">
                        <label htmlFor="search-metier">Métier</label>
                        <select id="search-metier" className="input" value={selectedMetier}
                            onChange={(e) => setSelectedMetier(e.target.value)}>
                            <option value="">Tous les métiers</option>
                            {metiers.map((metier) => (
                                <option key={metier.id_metier} value={metier.id_metier}>{metier.nom_metier}</option>
                            ))}
                        </select>
                    </div>
                    <div className="search-panel__actions">
                        <button type="submit" className="btn"><SearchIcon size={18} /> Rechercher</button>
                        {searched && <button type="button" className="btn btn-outline" onClick={handleReset}>Réinitialiser</button>}
                    </div>
                </form>

                <p className="results-count">
                    {!loading && !error && `${cardData.length} professionnel${cardData.length > 1 ? 's' : ''}`}
                </p>

                <div className="card-grid">
                    {loading && <p className="empty-state">Chargement des profils…</p>}
                    {!loading && error && <p className="empty-state">{error}</p>}
                    {!loading && !error && cardData.length === 0 && (
                        <p className="empty-state">Aucun profil ne correspond à votre recherche.</p>
                    )}
                    {!loading && cardData.map((card) => (
                        <CardH
                            key={card.id}
                            to={`/my_profils?id=${encodeURIComponent(card.id)}`}
                            imgSrc={card.image_url}
                            title={`${card.client.first_name} ${card.client.last_name}`}
                            subtitle={card.metiers.map((m) => m.nom_metier).join(' · ')}
                            rating={card.avis_moyenne}
                            reviews={card.nb_avis}
                            location={card.localisation}
                        />
                    ))}
                </div>
            </main>
            <Footer />
        </div>
    )
}
