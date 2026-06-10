# LudoPatia

Juego de casino en navegador. Sin dependencias externas, sin instalación. Abre index.html y listo.
El saldo y progreso se guardan en localStorage del navegador.

# Juegos
## Tragaperras
Apuesta una cantidad y gira tres carretes. Ganas si dos o tres coinciden. Los pagos van de x2 por par hasta x100 por tres sietes. Los carretes paran escalonados para dar tension.
## Ruleta Multiplicadora
Una ruleta con 18 segmentos de distintos multiplicadores. La mayoria son x0 o x1. El x20 existe pero ocupa un segmento muy pequeño. Apuesta y gira. La rueda frena lentamente al final.
## Ruleta Rojo/Negro
Apuesta a rojo, negro o verde. Rojo y negro pagan x2, verde paga x14. La probabilidad real es 18/38 para cada color y 2/38 para verde, igual que una ruleta americana. La animacion dura unos 5 segundos y desacelera al final.
## Blackjack
Blackjack clasico contra el dealer. Opciones: pedir carta, plantarse, doblar. Blackjack natural paga x2.5. El dealer saca hasta llegar a 17.
## Dados de la Suerte
Dos dados. Apuesta a que el total sera alto (8-12, paga x2), bajo (2-6, paga x2) o doble (mismo numero en ambos dados, paga x5).
## Crash
Un multiplicador sube desde 1x. Puedes retirar en cualquier momento. Si el cohete explota antes de que retires, pierdes la apuesta. El punto de explosion es aleatorio con ventaja para la casa del 5%.

# Mineria
Haz clic en la piedra para picarla. Cada golpe tiene un cooldown de 2 segundos. Los posibles drops son carbon, cobre, hierro, diamante, esmeralda y un drop secreto que aparece como incognito hasta que lo encuentras por primera vez.
Las probabilidades base son:

Nada: ~35%
Carbon: ~30%
Cobre: ~18%
Hierro: ~10%
Diamante: ~5%
Esmeralda: ~1.8%
Drop secreto: ~0.2% siempre, sin importar las mejoras

# Mejoras de mineria
Hay 8 niveles de mejora. Cada nivel reduce la probabilidad de no sacar nada o sacar carbon, y aumenta la probabilidad de los drops buenos. El drop secreto no mejora nunca.
Costos:

Nivel 1: $500
Nivel 2: $2,500
Nivel 3: $8,000
Nivel 4: $25,000
Nivel 5: $75,000
Nivel 6: $500,000
Nivel 7: $2,500,000
Nivel 8: $15,000,000

Los niveles 6, 7 y 8 son practicamente inalcanzables en condiciones normales.

# Tienda de peluches
Puedes gastar dinero en peluches para coleccionar. No tienen ninguna funcion mecanica, son solo coleccionables.
Hay 15 peluches en cuatro rarezas:

Comunes (5): entre $150 y $450
Raros (4): entre $2,500 y $5,000
Epicos (3): entre $25,000 y $60,000
Legendarios (3): $500,000 / $2,000,000 / $10,000,000


# Logros
Hay 21 logros en total. Se desbloquean automaticamente al cumplir condiciones como ganar cierta cantidad en una sola apuesta, acumular saldo, picar piedras, conseguir combinaciones especificas o comprar peluches. Aparece una notificacion cuando se desbloquea uno.
