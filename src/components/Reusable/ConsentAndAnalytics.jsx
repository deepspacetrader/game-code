import React, { useEffect } from 'react';
import CookieConsent, { Cookies, getCookieConsentValue } from 'react-cookie-consent';

export const GA_MEASUREMENT_ID = 'G-H350JRX6FC';

function injectGAScript() {
    if (window.gtagScriptInjected) return;
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);
    script.onload = () => {
        window.dataLayer = window.dataLayer || [];
        function gtag() {
            window.dataLayer.push(arguments);
        }
        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', GA_MEASUREMENT_ID);
    };
    window.gtagScriptInjected = true;
}

const ConsentAndAnalytics = () => {
    // Inject GA only if consent is given
    useEffect(() => {
        if (getCookieConsentValue && getCookieConsentValue('yes-to-cookies') === 'true') {
            injectGAScript();
        }
    }, []);

    return (
        <CookieConsent
            location="bottom"
            buttonText="Okay"
            declineButtonText="no thanks"
            enableDeclineButton
            cookieName="yes-to-cookies"
            style={{ background: '#2B373B' }}
            buttonStyle={{ color: '#4e503b', fontSize: '13px' }}
            expires={150}
            onAccept={() => {
                injectGAScript();
            }}
            onDecline={() => {
                const gaCookies = [
                    '_ga',
                    '_gid',
                    '_gat',
                    `_ga_${GA_MEASUREMENT_ID.replace('G-', '')}`,
                    `_gac_gb_${GA_MEASUREMENT_ID.replace('G-', '')}`,
                ];
                gaCookies.forEach((name) => {
                    Cookies.remove(name, { path: '/' });
                    Cookies.remove(name);
                });
                Object.keys(Cookies.get()).forEach((name) => {
                    if (
                        name.startsWith('_ga') ||
                        name.startsWith('_gid') ||
                        name.startsWith('_gat')
                    ) {
                        Cookies.remove(name, { path: '/' });
                        Cookies.remove(name);
                    }
                });
            }}
        >
            This website uses cookies for a better user experience.
        </CookieConsent>
    );
};

export default ConsentAndAnalytics;
