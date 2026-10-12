import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addToCart, toggleFavorite } from "../../api/cart";
import { CATEGORY_LABELS } from "../../api/categories";
import { CartIcon, HeartIcon } from "../icons/Icons";
import placeholder from "./images/placeholder.png";
import "./productCard.css";

export const formatPrice = (n) => `${Number(n).toLocaleString('fr-FR')} DA`;

// Carte produit utilisée par l'accueil, le marketplace et les favoris
export default function ProductCard({ product_id, image, description, price, productName, category, stock, favorite = false, onFavoriteChange }) {
    const navigate = useNavigate();
    const [heart, setHeart] = useState(favorite);
    const [adding, setAdding] = useState(false);
    useEffect(() => setHeart(favorite), [favorite]);

    const outOfStock = stock !== undefined && stock <= 0;

    async function heartClick() {
        const next = await toggleFavorite(product_id, heart, navigate);
        setHeart(next);
        if (onFavoriteChange && next !== heart) onFavoriteChange(product_id, next);
    }

    async function handleAdd() {
        setAdding(true);
        await addToCart(product_id, navigate);
        setAdding(false);
    }

    return (
        <article className="product-card">
            <div className="product-card__media">
                <img src={image || placeholder} alt={productName} loading="lazy" />
                {category && <span className="product-card__tag">{CATEGORY_LABELS[category] || category}</span>}
                <button
                    type="button"
                    className={`product-card__fav ${heart ? 'is-active' : ''}`}
                    onClick={heartClick}
                    aria-pressed={heart}
                    aria-label={heart ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                >
                    <HeartIcon size={18} filled={heart} />
                </button>
            </div>
            <div className="product-card__body">
                <h3 className="product-card__title">{productName}</h3>
                {description && <p className="product-card__desc">{description}</p>}
                <div className="product-card__footer">
                    <span className="product-card__price">{formatPrice(price)}</span>
                    <button type="button" className="btn btn-sm" onClick={handleAdd} disabled={adding || outOfStock}>
                        <CartIcon size={16} />
                        {outOfStock ? 'Épuisé' : 'Ajouter'}
                    </button>
                </div>
            </div>
        </article>
    );
}
