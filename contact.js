"use strict";

// =====================================
// INSTELLINGEN
// =====================================

const EDGE_FUNCTION_URL =
    "https://vzqpfikymnvowdypbpnb.supabase.co/functions/v1/verstuur-offerte";

const TOEGESTANE_PAKKETTEN = new Set([
    "simpel",
    "pro",
    "ultimate",
    "onbekend"
]);


// =====================================
// ELEMENTEN
// =====================================

const formulier =
    document.getElementById("offerteForm");

const melding =
    document.getElementById("formMessage");

const verzendKnop =
    document.getElementById("submitButton");

const pakketSelect =
    document.getElementById("pakket");

const naamInput =
    document.getElementById("naam");

const emailInput =
    document.getElementById("email");

const onderwerpInput =
    document.getElementById("onderwerp");

const berichtInput =
    document.getElementById("bericht");


// =====================================
// CONTROLE ELEMENTEN
// =====================================

if (
    !formulier ||
    !melding ||
    !verzendKnop ||
    !pakketSelect ||
    !naamInput ||
    !emailInput ||
    !onderwerpInput ||
    !berichtInput
) {
    throw new Error(
        "Een of meer onderdelen van het offerteformulier ontbreken."
    );
}


// =====================================
// MELDING TONEN
// =====================================

function toonMelding(
    tekst,
    type = ""
) {
    melding.textContent = tekst;

    melding.classList.remove(
        "form-message-success",
        "form-message-error",
        "form-message-warning"
    );

    if (type) {
        melding.classList.add(
            `form-message-${type}`
        );
    }
}


// =====================================
// PAKKET UIT URL
// =====================================

const urlParameters =
    new URLSearchParams(
        window.location.search
    );

const pakketUitUrl =
    urlParameters.get("pakket");

if (
    pakketUitUrl &&
    TOEGESTANE_PAKKETTEN.has(
        pakketUitUrl
    )
) {
    pakketSelect.value =
        pakketUitUrl;
}


// =====================================
// CAPTCHA
// =====================================

let captchaToken = null;


// Cloudflare Turnstile zoekt deze callbacks
// op window, daarom zetten we ze expliciet daar.

window.onCaptchaSuccess =
    function (token) {

        captchaToken =
            String(token || "");

        toonMelding("");
    };


window.onCaptchaExpired =
    function () {

        captchaToken = null;

        toonMelding(
            "De beveiligingscontrole is verlopen. Controleer opnieuw.",
            "warning"
        );
    };


window.onCaptchaError =
    function () {

        captchaToken = null;

        toonMelding(
            "De beveiligingscontrole kon niet worden geladen.",
            "error"
        );
    };


// =====================================
// CAPTCHA RESETTEN
// =====================================

function resetCaptcha() {

    captchaToken = null;

    if (
        window.turnstile &&
        typeof window.turnstile.reset ===
        "function"
    ) {
        window.turnstile.reset();
    }
}


// =====================================
// E-MAIL CONTROLEREN
// =====================================

function geldigEmailadres(email) {

    const emailRegex =
        /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

    return emailRegex.test(
        email
    );
}


// =====================================
// FORMULIER VERSTUREN
// =====================================

formulier.addEventListener(
    "submit",

    async function (event) {

        event.preventDefault();


        // HTML-validatie gebruiken

        if (
            !formulier.checkValidity()
        ) {
            formulier.reportValidity();
            return;
        }


        const naam =
            naamInput.value.trim();

        const email =
            emailInput.value
                .trim()
                .toLowerCase();

        const pakket =
            pakketSelect.value;

        const onderwerp =
            onderwerpInput.value.trim();

        const bericht =
            berichtInput.value.trim();


        // =================================
        // EXTRA FRONTEND VALIDATIE
        // =================================

        if (
            naam.length < 2
        ) {
            toonMelding(
                "Vul een geldige naam in.",
                "warning"
            );

            return;
        }


        if (
            !geldigEmailadres(email)
        ) {
            toonMelding(
                "Vul een geldig e-mailadres in.",
                "warning"
            );

            return;
        }


        if (
            !TOEGESTANE_PAKKETTEN.has(
                pakket
            )
        ) {
            toonMelding(
                "Kies eerst een geldig pakket.",
                "warning"
            );

            return;
        }


        if (
            bericht.length < 10
        ) {
            toonMelding(
                "Vertel iets meer over jouw website.",
                "warning"
            );

            return;
        }


        if (
            !captchaToken
        ) {
            toonMelding(
                "Voltooi eerst de beveiligingscontrole.",
                "warning"
            );

            return;
        }


        // =================================
        // KNOP BLOKKEREN
        // =================================

        verzendKnop.disabled =
            true;

        const knopTekst =
            verzendKnop.querySelector(
                "span"
            );

        if (knopTekst) {
            knopTekst.textContent =
                "Aanvraag wordt verzonden...";
        }


        toonMelding("");


        try {

            // =================================
            // EDGE FUNCTION
            // =================================

            const response =
                await fetch(
                    EDGE_FUNCTION_URL,
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                naam,
                                email,
                                pakket,
                                onderwerp,
                                bericht,
                                captchaToken
                            })
                    }
                );


            // Token altijd als gebruikt beschouwen
            captchaToken = null;


            let result = {};


            try {

                result =
                    await response.json();

            } catch {

                result = {};
            }


            // =================================
            // FOUT
            // =================================

            if (
                !response.ok
            ) {

                console.error(
                    "Edge Function fout:",
                    response.status,
                    result
                );


                toonMelding(
                    typeof result.error ===
                        "string"

                        ? result.error

                        : "Er ging iets mis. Probeer het opnieuw.",
                    "error"
                );


                resetCaptcha();

                return;
            }


            // =================================
            // GELUKT
            // =================================

            toonMelding(
                "✓ Bedankt! Je aanvraag is succesvol verzonden.",
                "success"
            );


            formulier.reset();

            resetCaptcha();

        } catch (error) {

            console.error(
                "Verbindingsfout:",
                error
            );


            toonMelding(
                "Er kon geen verbinding worden gemaakt. Probeer het opnieuw.",
                "error"
            );


            resetCaptcha();

        } finally {

            verzendKnop.disabled =
                false;


            if (knopTekst) {
                knopTekst.textContent =
                    "Offerte aanvragen";
            }

        }

    }
);
