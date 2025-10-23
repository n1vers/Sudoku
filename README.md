# Sudoku
Veebirakendus, mis võimaldab kasutajatel mängida Sudoku’t, genereerida uusi mõistatusi, kontrollida oma lahendusi ja salvestada tulemusi andmebaasi.
# Frontend
 
ReactJS
TailwindCSS
HeroUI
 
# Backend
 
PHP
MySQL
 
# Funktsioonid
 
Sudoku mõistatuste genereerimine (erinevad raskusastmed)
Sudoku lahendamine otse veebis interaktiivses ruudustikus
Lahenduse automaattuvastus (õige/vale sisestus)
Kasutajakontod – registreerimine, sisselogimine, tulemuste salvestamine
Skorid ja tulemused – mänguajaga seotud statistika
Dark/Light režiim (HeroUI teema tugi)
Edetabel – parimad mängijad, kiireimad lahendajad
 
# Põhifunktsioonid
 
Kasutajate haldus: registreerimine, sisselogimine, väljalogimine
Sudoku generaator: backendis luuakse uus Sudoku (raskustasemega – easy, medium, hard)
Andmebaas (MySQL): kasutajate, mängude ja tulemuste salvestamine
Interaktiivne Sudoku laud: frontendis React + HeroUI abil
Reaalajas valideerimine: kasutaja sisestab numbri → frontend kontrollib ja annab kohese visuaalse tagasiside
Statistika ja edetabel: Laravel API tagastab kasutajate tulemused, mis kuvatakse HeroUI tabelikomponentides
