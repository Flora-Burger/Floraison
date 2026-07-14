/** Dernière mise à jour affichée dans l'app — à synchroniser avec le texte ci-dessous. */
export const PRIVACY_POLICY_UPDATED = '14 juillet 2026';

export const PRIVACY_CONTACT_EMAIL =
  process.env.EXPO_PUBLIC_PRIVACY_CONTACT_EMAIL ?? 'brg.flora@gmail.com';

export const PRIVACY_POLICY_SECTIONS: { title: string; body: string }[] = [
  {
    title: '1. Responsable du traitement',
    body: `Floraison est une application de suivi menstruel éditée à titre personnel. Pour toute question relative à vos données personnelles, contactez-nous à ${PRIVACY_CONTACT_EMAIL}.`,
  },
  {
    title: '2. Données collectées',
    body:
      'Nous collectons uniquement les données que vous saisissez volontairement :\n' +
      '• Identifiant de compte (adresse e-mail) et mot de passe chiffré\n' +
      '• Données de cycle : règles, flux, symptômes physiques, humeur, sommeil, peau, pertes, envies alimentaires, libido\n' +
      '• Notes de journal intime (texte libre)\n' +
      '• Préférences locales : code PIN (stocké sur votre appareil), paramètres de rappels\n\n' +
      'Nous ne vendons pas vos données et ne diffusons pas de publicité ciblée.',
  },
  {
    title: '3. Finalités et base légale',
    body:
      'Vos données sont traitées pour :\n' +
      '• Permettre le suivi de votre cycle et l’affichage de vos statistiques personnelles\n' +
      '• Synchroniser vos données entre vos sessions connectées\n' +
      '• Générer des rapports PDF si vous le demandez\n' +
      '• Envoyer des rappels locaux si vous les activez\n\n' +
      'La base légale est votre consentement (RGPD art. 6.1.a), que vous retirez en supprimant votre compte.',
  },
  {
    title: '4. Hébergement et sécurité',
    body:
      'Les données de compte et de cycle sont hébergées par Supabase (infrastructure cloud PostgreSQL) avec chiffrement en transit (HTTPS/TLS). L’accès aux données est protégé par authentification et des règles de sécurité au niveau de la base (Row Level Security) : chaque utilisatrice n’accède qu’à ses propres enregistrements.',
  },
  {
    title: '5. Durée de conservation',
    body:
      'Vos données sont conservées tant que votre compte est actif. Si vous supprimeez votre compte depuis les paramètres, vos données de cycle et votre compte d’authentification sont effacés de nos serveurs. Les données stockées localement sur votre appareil (code PIN, préférences) sont supprimées lors de la procédure de suppression.',
  },
  {
    title: '6. Vos droits (RGPD)',
    body:
      'Conformément au Règlement général sur la protection des données, vous disposez des droits suivants :\n' +
      '• Accès et rectification : modifiez vos entrées directement dans l’application\n' +
      '• Portabilité : exportez un rapport PDF depuis les paramètres\n' +
      '• Effacement : supprimez votre compte et toutes vos données via « Supprimer mon compte et mes données »\n' +
      '• Retrait du consentement : déconnectez-vous ou supprimez votre compte\n\n' +
      `Pour exercer vos droits ou signaler un problème : ${PRIVACY_CONTACT_EMAIL}. Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).`,
  },
  {
    title: '7. Données de santé',
    body:
      'Floraison permet un auto-suivi à visée informative. Elle ne constitue pas un dispositif médical et ne remplace pas un avis médical. Les informations que vous enregistrez peuvent être sensibles : ne partagez votre rapport PDF qu’avec des personnes ou professionnels de confiance.',
  },
  {
    title: '8. Modifications',
    body:
      'Cette politique peut être mise à jour. La date de dernière mise à jour est indiquée en haut de cette page. En cas de changement important, nous vous en informerons dans l’application.',
  },
];
