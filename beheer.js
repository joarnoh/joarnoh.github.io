"use strict";


// =====================================
// SUPABASE
// =====================================

const SUPABASE_URL =
    "https://vzqpfikymnvowdypbpnb.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_HeLNv4p7Fc3gAzp5jHOk7Q_zPDxNaQB";


const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// =====================================
// ELEMENTEN
// =====================================

const adminApp =
    document.getElementById(
        "adminApp"
    );

const userEmail =
    document.getElementById(
        "userEmail"
    );

const aanvragenLijst =
    document.getElementById(
        "aanvragenLijst"
    );

const zoekAanvraag =
    document.getElementById(
        "zoekAanvraag"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );

const aantalNieuw =
    document.getElementById(
        "aantalNieuw"
    );

const aantalBehandeld =
    document.getElementById(
        "aantalBehandeld"
    );

const aantalTotaal =
    document.getElementById(
        "aantalTotaal"
    );


// =====================================
// ELEMENTCONTROLE
// =====================================

if (
    !adminApp ||
    !userEmail ||
    !aanvragenLijst ||
    !zoekAanvraag ||
    !logoutButton ||
    !aantalNieuw ||
    !aantalBehandeld ||
    !aantalTotaal
) {
    throw new Error(
        "Onderdelen van het beheerdersdashboard ontbreken."
    );
}


// =====================================
// VARIABELEN
// =====================================

let alleAanvragen = [];

let huidigFilter =
    "alle";

let adminGoedgekeurd =
    false;


// =====================================
// TOEGESTANE WAARDEN
// =====================================

const geldigePakketten =
    new Set([
        "simpel",
        "pro",
        "ultimate",
        "onbekend"
    ]);


const geldigeFilters =
    new Set([
        "alle",
        "nieuw",
        "behandeld"
    ]);


// =====================================
// PAKKETNAAM
// =====================================

function pakketNaam(pakket) {

    const pakketten = {
        simpel:
            "Simpel – €100",

        pro:
            "Pro – €250",

        ultimate:
            "Ultimate – €350",

        onbekend:
            "Nog niet gekozen"
    };


    return (
        pakketten[pakket] ||
        "Niet opgeslagen"
    );
}


// =====================================
// VEILIGE PAKKETCLASS
// =====================================

function pakketClass(pakket) {

    if (
        geldigePakketten.has(
            pakket
        )
    ) {
        return (
            "pakket-" +
            pakket
        );
    }


    return "pakket-geen";
}


// =====================================
// GELDIG ID
// =====================================

function geldigId(waarde) {

    const id =
        Number(waarde);


    if (
        !Number.isSafeInteger(id) ||
        id <= 0
    ) {
        return null;
    }


    return id;
}


// =====================================
// DATUM OPMAKEN
// =====================================

function formatDatum(waarde) {

    const datum =
        new Date(waarde);


    if (
        Number.isNaN(
            datum.getTime()
        )
    ) {
        return "Onbekende datum";
    }


    return new Intl.DateTimeFormat(
        "nl-NL",
        {
            dateStyle:
                "medium",

            timeStyle:
                "short"
        }
    ).format(datum);
}


// =====================================
// TEKSTREGEL MAKEN
// =====================================

function maakTekstRegel(
    label,
    waarde
) {

    const p =
        document.createElement(
            "p"
        );


    const strong =
        document.createElement(
            "strong"
        );


    strong.textContent =
        label;


    const br =
        document.createElement(
            "br"
        );


    const tekst =
        document.createTextNode(
            waarde ?? ""
        );


    p.append(
        strong,
        br,
        tekst
    );


    return p;
}


// =====================================
// BERICHTREGEL
// =====================================

function maakBerichtRegel(
    bericht
) {

    const p =
        document.createElement(
            "p"
        );


    const strong =
        document.createElement(
            "strong"
        );


    strong.textContent =
        "Bericht";


    const br =
        document.createElement(
            "br"
        );


    const span =
        document.createElement(
            "span"
        );


    span.textContent =
        bericht ||
        "Geen bericht toegevoegd.";


    span.className =
        "aanvraag-bericht";


    p.append(
        strong,
        br,
        span
    );


    return p;
}


// =====================================
// PAKKETREGEL
// =====================================

function maakPakketRegel(
    pakket
) {

    const p =
        document.createElement(
            "p"
        );


    p.className =
        "pakket-regel";


    const strong =
        document.createElement(
            "strong"
        );


    strong.textContent =
        "Pakket";


    const badge =
        document.createElement(
            "span"
        );


    badge.classList.add(
        "pakket-badge",
        pakketClass(pakket)
    );


    badge.textContent =
        pakketNaam(pakket);


    p.append(
        strong,
        badge
    );


    return p;
}


// =====================================
// STATISTIEKEN
// =====================================

function updateStatistieken() {

    const totaal =
        alleAanvragen.length;


    const behandeld =
        alleAanvragen.filter(
            aanvraag =>
                aanvraag.status ===
                "behandeld"
        ).length;


    const nieuw =
        alleAanvragen.filter(
            aanvraag =>
                aanvraag.status !==
                "behandeld"
        ).length;


    aantalNieuw.textContent =
        String(nieuw);


    aantalBehandeld.textContent =
        String(behandeld);


    aantalTotaal.textContent =
        String(totaal);
}


// =====================================
// FILTEREN + ZOEKEN
// =====================================

function filterAanvragen() {

    const zoekterm =
        zoekAanvraag
            .value
            .toLowerCase()
            .trim();


    return alleAanvragen.filter(
        aanvraag => {

            let statusKlopt =
                true;


            if (
                huidigFilter ===
                "nieuw"
            ) {
                statusKlopt =
                    aanvraag.status !==
                    "behandeld";
            }


            if (
                huidigFilter ===
                "behandeld"
            ) {
                statusKlopt =
                    aanvraag.status ===
                    "behandeld";
            }


            const zoekTekst = [
                aanvraag.naam,
                aanvraag.email,
                aanvraag.pakket,
                pakketNaam(
                    aanvraag.pakket
                ),
                aanvraag.onderwerp,
                aanvraag.bericht
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            return (
                statusKlopt &&
                zoekTekst.includes(
                    zoekterm
                )
            );
        }
    );
}


// =====================================
// GEEN RESULTATEN
// =====================================

function toonGeenResultaten(
    tekst
) {

    aanvragenLijst
        .replaceChildren();


    const container =
        document.createElement(
            "div"
        );


    container.className =
        "geen-resultaten";


    const p =
        document.createElement(
            "p"
        );


    p.textContent =
        tekst;


    container.appendChild(p);

    aanvragenLijst
        .appendChild(
            container
        );
}


// =====================================
// AANVRAAGKAART
// =====================================

function maakAanvraagKaart(
    aanvraag
) {

    const kaart =
        document.createElement(
            "div"
        );


    kaart.className =
        "aanvraag-card";


    const status =
        aanvraag.status ===
        "behandeld"

            ? "behandeld"
            : "nieuw";


    // =================================
    // HEADER
    // =================================

    const header =
        document.createElement(
            "div"
        );


    header.className =
        "aanvraag-header";


    const titel =
        document.createElement(
            "h3"
        );


    titel.textContent =
        aanvraag.onderwerp ||
        "Nieuwe websiteaanvraag";


    const statusBadge =
        document.createElement(
            "span"
        );


    statusBadge.className =
        "status-badge";


    statusBadge.textContent =
        status;


    header.append(
        titel,
        statusBadge
    );


    kaart.appendChild(
        header
    );


    // =================================
    // NAAM
    // =================================

    kaart.appendChild(
        maakTekstRegel(
            "Naam",
            aanvraag.naam ||
            "Niet ingevuld"
        )
    );


    // =================================
    // EMAIL
    // =================================

    kaart.appendChild(
        maakTekstRegel(
            "E-mail",
            aanvraag.email ||
            "Niet ingevuld"
        )
    );


    // =================================
    // PAKKET
    // =================================

    kaart.appendChild(
        maakPakketRegel(
            aanvraag.pakket
        )
    );


    // =================================
    // DATUM
    // =================================

    kaart.appendChild(
        maakTekstRegel(
            "Ontvangen",
            formatDatum(
                aanvraag.created_at
            )
        )
    );


    // =================================
    // BERICHT
    // =================================

    kaart.appendChild(
        maakBerichtRegel(
            aanvraag.bericht
        )
    );


    // =================================
    // ID CONTROLEREN
    // =================================

    const id =
        geldigId(
            aanvraag.id
        );


    if (!id) {

        console.error(
            "Ongeldig aanvraag-ID:",
            aanvraag.id
        );


        return kaart;
    }


    // =================================
    // STATUSKNOP
    // =================================

    if (
        status ===
        "behandeld"
    ) {

        const behandeldButton =
            document.createElement(
                "button"
            );


        behandeldButton.type =
            "button";


        behandeldButton.className =
            "behandeld-button";


        behandeldButton.disabled =
            true;


        behandeldButton.textContent =
            "✓ Behandeld";


        kaart.appendChild(
            behandeldButton
        );

    } else {

        const behandelButton =
            document.createElement(
                "button"
            );


        behandelButton.type =
            "button";


        behandelButton.className =
            "behandel-button";


        behandelButton.textContent =
            "✓ Markeer als behandeld";


        behandelButton
            .addEventListener(
                "click",
                async () => {

                    behandelButton.disabled =
                        true;


                    await markeerAlsBehandeld(
                        id,
                        behandelButton
                    );
                }
            );


        kaart.appendChild(
            behandelButton
        );
    }


    // =================================
    // VERWIJDERKNOP
    // =================================

    const verwijderButton =
        document.createElement(
            "button"
        );


    verwijderButton.type =
        "button";


    verwijderButton.className =
        "verwijder-button";


    verwijderButton.textContent =
        "Verwijderen";


    verwijderButton
        .addEventListener(
            "click",
            async () => {

                await verwijderAanvraag(
                    id,
                    verwijderButton
                );
            }
        );


    kaart.appendChild(
        verwijderButton
    );


    return kaart;
}


// =====================================
// AANVRAGEN TONEN
// =====================================

function toonAanvragen() {

    const aanvragen =
        filterAanvragen();


    aanvragenLijst
        .replaceChildren();


    if (
        aanvragen.length === 0
    ) {

        toonGeenResultaten(
            "Geen aanvragen gevonden."
        );

        return;
    }


    const fragment =
        document.createDocumentFragment();


    aanvragen.forEach(
        aanvraag => {

            fragment.appendChild(
                maakAanvraagKaart(
                    aanvraag
                )
            );
        }
    );


    aanvragenLijst
        .appendChild(
            fragment
        );
}


// =====================================
// AANVRAGEN LADEN
// =====================================

async function laadAanvragen() {

    if (
        !adminGoedgekeurd
    ) {
        return;
    }


    aanvragenLijst.textContent =
        "Aanvragen worden geladen...";


    const {
        data: aanvragen,
        error
    } =
        await supabaseClient
            .from(
                "offerte_aanvragen"
            )
            .select(
                `
                id,
                created_at,
                naam,
                email,
                pakket,
                onderwerp,
                bericht,
                status
                `
            )
            .order(
                "created_at",
                {
                    ascending:
                        false
                }
            );


    if (error) {

        console.error(
            "Fout bij ophalen aanvragen:",
            error
        );


        toonGeenResultaten(
            "De aanvragen konden niet worden geladen."
        );


        return;
    }


    alleAanvragen =
        Array.isArray(aanvragen)
            ? aanvragen
            : [];


    updateStatistieken();

    toonAanvragen();
}


// =====================================
// MARKEREN ALS BEHANDELD
// =====================================

async function markeerAlsBehandeld(
    waarde,
    knop
) {

    if (
        !adminGoedgekeurd
    ) {
        return;
    }


    const id =
        geldigId(
            waarde
        );


    if (!id) {

        alert(
            "Ongeldig aanvraag-ID."
        );

        return;
    }


    const { error } =
        await supabaseClient
            .from(
                "offerte_aanvragen"
            )
            .update({
                status:
                    "behandeld"
            })
            .eq(
                "id",
                id
            );


    if (error) {

        console.error(
            "Fout bij wijzigen status:",
            error
        );


        if (knop) {
            knop.disabled =
                false;
        }


        alert(
            "De status kon niet worden gewijzigd."
        );


        return;
    }


    await laadAanvragen();
}


// =====================================
// VERWIJDEREN
// =====================================

async function verwijderAanvraag(
    waarde,
    knop
) {

    if (
        !adminGoedgekeurd
    ) {
        return;
    }


    const id =
        geldigId(
            waarde
        );


    if (!id) {

        alert(
            "Ongeldig aanvraag-ID."
        );

        return;
    }


    const bevestiging =
        confirm(
            "Weet je zeker dat je deze offerteaanvraag wilt verwijderen?\n\nDit kan niet ongedaan worden gemaakt."
        );


    if (!bevestiging) {
        return;
    }


    if (knop) {

        knop.disabled =
            true;

        knop.textContent =
            "Verwijderen...";
    }


    const { error } =
        await supabaseClient
            .from(
                "offerte_aanvragen"
            )
            .delete()
            .eq(
                "id",
                id
            );


    if (error) {

        console.error(
            "Fout bij verwijderen:",
            error
        );


        if (knop) {

            knop.disabled =
                false;

            knop.textContent =
                "Verwijderen";
        }


        alert(
            "De aanvraag kon niet worden verwijderd."
        );


        return;
    }


    await laadAanvragen();
}


// =====================================
// LIVE ZOEKEN
// =====================================

zoekAanvraag
    .addEventListener(
        "input",
        toonAanvragen
    );


// =====================================
// FILTERKNOPPEN
// =====================================

const filterKnoppen =
    document.querySelectorAll(
        ".filter-button"
    );


filterKnoppen.forEach(
    knop => {

        knop.addEventListener(
            "click",
            () => {

                const filter =
                    knop.dataset.filter;


                if (
                    !geldigeFilters.has(
                        filter
                    )
                ) {
                    return;
                }


                huidigFilter =
                    filter;


                filterKnoppen.forEach(
                    andereKnop => {

                        andereKnop
                            .classList
                            .remove(
                                "active-filter"
                            );


                        andereKnop
                            .setAttribute(
                                "aria-pressed",
                                "false"
                            );
                    }
                );


                knop.classList.add(
                    "active-filter"
                );


                knop.setAttribute(
                    "aria-pressed",
                    "true"
                );


                toonAanvragen();
            }
        );
    }
);


// =====================================
// REDIRECT HELPERS
// =====================================

function naarLogin() {

    adminGoedgekeurd =
        false;


    adminApp.hidden =
        true;


    window.location.replace(
        "login.html"
    );
}


function naarHomepage() {

    adminGoedgekeurd =
        false;


    adminApp.hidden =
        true;


    window.location.replace(
        "index.html"
    );
}


// =====================================
// ADMIN CONTROLEREN
// =====================================

async function controleerBeheerder() {

    adminApp.hidden =
        true;


    adminGoedgekeurd =
        false;


    try {

        const {
            data: userData,
            error: userError
        } =
            await supabaseClient
                .auth
                .getUser();


        // =================================
        // NIET INGELOGD
        // =================================

        if (
            userError ||
            !userData?.user
        ) {

            naarLogin();

            return;
        }


        const gebruiker =
            userData.user;


        // =================================
        // PROFIEL CONTROLEREN
        // =================================

        const {
            data: profiel,
            error: profielError
        } =
            await supabaseClient
                .from(
                    "profiles"
                )
                .select(
                    "role"
                )
                .eq(
                    "id",
                    gebruiker.id
                )
                .single();


        // =================================
        // GEEN PROFIEL
        // =================================

        if (
            profielError ||
            !profiel
        ) {

            console.error(
                "Profielcontrole mislukt:",
                profielError
            );


            alert(
                "Je hebt geen toegang tot het beheerdersoverzicht."
            );


            naarHomepage();

            return;
        }


        // =================================
        // GEEN ADMIN
        // =================================

        if (
            profiel.role !==
            "admin"
        ) {

            alert(
                "Je hebt geen beheerdersrechten."
            );


            naarHomepage();

            return;
        }


        // =================================
        // ADMIN GOEDGEKEURD
        // =================================

        adminGoedgekeurd =
            true;


        userEmail.textContent =
            gebruiker.email

                ? "Ingelogd als beheerder: " +
                  gebruiker.email

                : "Ingelogd als beheerder";


        adminApp.hidden =
            false;


        await laadAanvragen();

    } catch (error) {

        console.error(
            "Admincontrole mislukt:",
            error
        );


        naarLogin();
    }
}


// =====================================
// UITLOGGEN
// =====================================

logoutButton
    .addEventListener(
        "click",
        async () => {

            logoutButton.disabled =
                true;


            logoutButton.textContent =
                "Uitloggen...";


            adminApp.hidden =
                true;


            adminGoedgekeurd =
                false;


            const { error } =
                await supabaseClient
                    .auth
                    .signOut();


            if (error) {

                console.error(
                    "Uitloggen mislukt:",
                    error
                );


                logoutButton.disabled =
                    false;


                logoutButton.textContent =
                    "Uitloggen";


                adminApp.hidden =
                    false;


                alert(
                    "Uitloggen is mislukt. Probeer het opnieuw."
                );


                return;
            }


            window.location.replace(
                "login.html"
            );
        }
    );


// =====================================
// SESSIE BEWAKEN
// =====================================

supabaseClient
    .auth
    .onAuthStateChange(
        event => {

            if (
                event ===
                "SIGNED_OUT"
            ) {

                adminGoedgekeurd =
                    false;


                adminApp.hidden =
                    true;
            }
        }
    );


// =====================================
// START
// =====================================

controleerBeheerder();
