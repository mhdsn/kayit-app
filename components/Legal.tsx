import React, { useState } from 'react';
import { ArrowLeft, Shield, FileText } from 'lucide-react';

interface LegalProps {
  onBack: () => void;
}

const Legal: React.FC<LegalProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>('privacy');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <button 
                onClick={onBack}
                className="flex items-center text-slate-600 hover:text-brand-600 transition-colors font-medium"
            >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Retour
            </button>
            <h1 className="text-xl font-bold text-slate-900">Mentions Légales & Confidentialité</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Navigation des onglets */}
        <div className="flex gap-4 mb-8 border-b border-slate-200">
            <button
                onClick={() => setActiveTab('privacy')}
                className={`pb-3 px-1 flex items-center gap-2 font-medium transition-colors border-b-2 ${
                    activeTab === 'privacy' 
                    ? 'border-brand-600 text-brand-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
            >
                <Shield className="w-4 h-4" />
                Politique de Confidentialité
            </button>
            <button
                onClick={() => setActiveTab('terms')}
                className={`pb-3 px-1 flex items-center gap-2 font-medium transition-colors border-b-2 ${
                    activeTab === 'terms' 
                    ? 'border-brand-600 text-brand-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
            >
                <FileText className="w-4 h-4" />
                Conditions d'Utilisation (CGU)
            </button>
        </div>

        {/* Contenu */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 prose prose-slate max-w-none">
            
            {activeTab === 'privacy' && (
                <div>
                    <h2>Politique de Confidentialité</h2>
                    <p className="text-sm text-slate-500">Dernière mise à jour : {new Date().toLocaleDateString()}</p>
                    
                    <h3>1. Collecte des données</h3>
                    <p>Dans le cadre de l'utilisation de l'application Kayit, nous collectons les informations suivantes :</p>
                    <ul>
                        <li>Informations de compte (Nom, Email, Photo via Google Auth).</li>
                        <li>Données d'entreprise (Nom de l'entreprise, Adresse, Téléphone).</li>
                        <li>Données de facturation (Clients, Factures, Montants).</li>
                    </ul>

                    <h3>2. Utilisation des données</h3>
                    <p>Vos données sont utilisées uniquement pour :</p>
                    <ul>
                        <li>Fournir le service de génération de factures.</li>
                        <li>Vous authentifier via Google ou Email.</li>
                        <li>Améliorer le service et corriger les bugs.</li>
                    </ul>
                    <p><strong>Nous ne vendons jamais vos données à des tiers.</strong></p>

                    <h3>3. Stockage et Sécurité</h3>
                    <p>Vos données sont stockées de manière sécurisée sur les serveurs de Supabase (basés en Europe/USA suivant la région).</p>

                    <h3>4. Vos droits</h3>
                    <p>Conformément aux lois en vigueur, vous pouvez demander la suppression intégrale de votre compte et de vos données en contactant l'administrateur à : contact@kayit.app (ou ton email).</p>
                </div>
            )}

            {activeTab === 'terms' && (
                <div>
                    <h2>Conditions Générales d'Utilisation (CGU)</h2>
                    <p className="text-sm text-slate-500">Dernière mise à jour : {new Date().toLocaleDateString()}</p>

                    <h3>1. Objet</h3>
                    <p>Kayit est un logiciel SaaS (Software as a Service) permettant aux entrepreneurs d'éditer des factures.</p>

                    <h3>2. Responsabilité</h3>
                    <p>Kayit est un outil d'aide à la gestion. L'éditeur ne saurait être tenu responsable des erreurs comptables, fiscales ou de la non-conformité des documents générés par l'utilisateur. L'utilisateur est seul responsable de ses obligations légales.</p>

                    <h3>3. Tarification</h3>
                    <p>L'accès au service peut être gratuit (Starter) ou payant (Business). Les tarifs sont indiqués sur la page "Tarifs".</p>

                    <h3>4. Résiliation</h3>
                    <p>L'utilisateur peut cesser d'utiliser le service à tout moment.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Legal;