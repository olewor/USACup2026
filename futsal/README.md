# Futsal – Haugsbygd J17

Alt ligger i `data.json`:
- `program` – treninger og kampdager
- `kamper` – resultat og individuelle matchpoeng per kamp (mål, assist, matchavgjørende, kampens øyeblikk). Poengverdi per kategori står i `poengverdier`.
- `christmasGames.konkurranser` – én oppføring per konkurranse med poeng per spiller (f.eks. 1 til alle på vinnerlaget, 1 til vinner og 0,5 til andreplass individuelt)
- `spillere` – alle spillerne (vises også med 0 poeng)

Bilder til chatgruppa:

    node futsal/render.js program
    node futsal/render.js poeng
    node futsal/render.js christmas
    node futsal/render.js lag 3 Ola Kari Per ...   # jevne lag etter Christmas Games-stillingen
