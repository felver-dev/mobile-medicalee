export interface Garantie {
  code: string;
  libelle: string;
}

export const GARANTIES: Garantie[] = [
  { code: 'EXA', libelle: 'Autres examens' },
  { code: 'AUX', libelle: 'Auxiliaires médicaux' },
  { code: 'AMP', libelle: 'Assistance médicale à la procréation' },
  { code: 'BILN', libelle: 'Bilan de santé' },
  { code: 'BIO', libelle: 'Biologie' },
  { code: 'CONS', libelle: 'Consultation' },
  { code: 'DEN', libelle: 'Dentisterie' },
  { code: 'HOS', libelle: 'Hospitalisation' },
  { code: 'IMA', libelle: 'Imagerie & examens spécialisés' },
  { code: 'MAT', libelle: 'Maternité' },
  { code: 'OPT', libelle: 'Optique' },
  { code: 'PHARMA', libelle: 'PHARMACIE' },
  { code: 'TRA', libelle: 'Transport médicalisé' }
];

export const GARANTIES_WITH_ALL: Garantie[] = [
  { code: '', libelle: 'Toutes les garanties' },
  ...GARANTIES
];

export const getGarantieByCode = (code: string): Garantie | undefined => {
  return GARANTIES.find(garantie => garantie.code === code);
};

export const getGarantieLibelle = (code: string): string => {
  const garantie = getGarantieByCode(code);
  return garantie ? garantie.libelle : 'Non renseigné';
};
