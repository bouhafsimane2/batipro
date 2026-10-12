import React from 'react';
import './table.css';

/*
 * Tableau générique de l'espace admin.
 *   columns : [{ key, label, render?(row) }]
 *   rows    : données
 *   actions?(row) : boutons affichés en fin de ligne
 * Sur mobile, chaque ligne devient une carte (libellé à gauche, valeur à droite).
 */
function Table({ columns, rows, actions, getKey = (row, i) => row.id ?? i, empty = 'Aucun élément', loading = false }) {
    return (
        <div className="data-table surface">
            <table>
                <thead>
                    <tr>
                        {columns.map((c) => <th key={c.key} scope="col">{c.label}</th>)}
                        {actions && <th scope="col"><span className="visually-hidden">Actions</span></th>}
                    </tr>
                </thead>
                <tbody>
                    {loading && (
                        <tr className="data-table__empty"><td colSpan={columns.length + 1}>Chargement…</td></tr>
                    )}
                    {!loading && rows.length === 0 && (
                        <tr className="data-table__empty"><td colSpan={columns.length + 1}>{empty}</td></tr>
                    )}
                    {!loading && rows.map((row, i) => (
                        <tr key={getKey(row, i)}>
                            {columns.map((c) => (
                                <td key={c.key} data-label={c.label}>
                                    {c.render ? c.render(row) : row[c.key]}
                                </td>
                            ))}
                            {actions && <td className="data-table__actions">{actions(row)}</td>}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Table;
