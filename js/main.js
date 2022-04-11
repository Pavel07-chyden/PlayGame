const SCREEN_WIDTH = window.innerWidth;
const SCREEN_HEIGHT = window.innerHeight;

console.log('111');

const canvas = document.createElement("canvas");// определяем EL-ент
canvas.setAttribute("width", SCREEN_WIDTH);
canvas.setAttribute("height", SCREEN_HEIGHT);
document.body.appendChild(canvas);// el холста в теле El-та


const context = canvas.getContext('2d') // APi для очисти экрана

const TICK = 30;

// Рисуем карту 
const CELL_SIZE = 64 // разсер ячейки
const PLAYER_SIZE = 10; // размер игрока
const FOV = toRadians(60); // угол напрвавления луча
const COLORS = { //цветовая схема луча
   floor: '#e16a61',
   ceiling: "#ffffff",
   wall: "#18aa6c",
   wallDark: "#1ed587",
   rays: "#ffe599",
}
//карта  каждая строка горизнгталь, а основаная массив этих строк
const map = [
   [1, 1, 1, 1, 1, 1, 1],
   [1, 0, 0, 0, 0, 0, 1],
   [1, 0, 1, 1, 0, 1, 1],
   [1, 0, 0, 0, 0, 0, 1],
   [1, 0, 1, 0, 1, 0, 1],
   [1, 0, 1, 0, 1, 0, 1],
   [1, 1, 1, 1, 1, 1, 1],
]
///положение игрока угол и напрвление// каждая позиция 64  + угол angle 0, + скорость speed
const player = {
   x: CELL_SIZE * 1.5,
   y: CELL_SIZE * 2,
   angle: toRadians(0),
   speed: 0

}

function clearScreen() {  // очистки экрана
   context.fillStyle = "red";// обновить красный цвет
   context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);//поле context   rayc - Arr лучей(rays)
}
function movePlayer() {
   player.x += Math.cos(player.angle) * player.speed
   player.y += Math.sin(player.angle) * player.speed
}
// ------
function toRadians(deg) {
   return (deg * Math.PI) / 180;
}
//---------------------------------------------------------
function distance(x1, y1, x2, y2) {
   return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function outOfMapBounds(x, y) {
   return x < 0 || x >= map[0].length || y < 0 || y >= map.length;
}

function getVCollision(angle) { // //вертикальное столкновкние 
   const right = Math.abs(Math.floor((angle - Math.PI / 2) / Math.PI) % 2); // правое отклонение угла
 // первое пересечение с ближайшей вертикалью   x    y 
   const firstX = right
      ? Math.floor(player.x / CELL_SIZE) * CELL_SIZE + CELL_SIZE
      : Math.floor(player.x / CELL_SIZE) * CELL_SIZE;

   const firstY = player.y + (firstX - player.x) * Math.tan(angle);

   const xA = right ? CELL_SIZE : -CELL_SIZE;
   const yA = xA * Math.tan(angle);

   let wall;
   let nextX = firstX;
   let nextY = firstY;
   while (!wall) {
      const cellX = right
         ? Math.floor(nextX / CELL_SIZE)
         : Math.floor(nextX / CELL_SIZE) - 1;
      const cellY = Math.floor(nextY / CELL_SIZE);

      if (outOfMapBounds(cellX, cellY)) {
         break;
      }
      wall = map[cellY][cellX];
      if (!wall) {
         nextX += xA;
         nextY += yA;
      } else {
      }
   }
   return {
      angle,
      distance: distance(player.x, player.y, nextX, nextY),
      vertical: true,
   };
}

function getHCollision(angle) {
   const up = Math.abs(Math.floor(angle / Math.PI) % 2);
   const firstY = up
      ? Math.floor(player.y / CELL_SIZE) * CELL_SIZE
      : Math.floor(player.y / CELL_SIZE) * CELL_SIZE + CELL_SIZE;
   const firstX = player.x + (firstY - player.y) / Math.tan(angle);

   const yA = up ? -CELL_SIZE : CELL_SIZE;
   const xA = yA / Math.tan(angle);

   let wall;
   let nextX = firstX;
   let nextY = firstY;
   while (!wall) {
      const cellX = Math.floor(nextX / CELL_SIZE);
      const cellY = up
         ? Math.floor(nextY / CELL_SIZE) - 1
         : Math.floor(nextY / CELL_SIZE);

      if (outOfMapBounds(cellX, cellY)) {
         break;
      }

      wall = map[cellY][cellX];
      if (!wall) {
         nextX += xA;
         nextY += yA;
      }
   }
   return {
      angle,
      distance: distance(player.x, player.y, nextX, nextY),
      vertical: false,
   };
}



//луч индивидуальной функции// проверяем есть ли стена
function castRay(angle) {
   const vCollision = getVCollision(angle) //вертикальное столкновкние 
   const hCollision = getHCollision(angle) // горизонтальное столкновение

   return hCollision.distance >= vCollision.distance ? vCollision : hCollision;//вернуть расстояние столкновения  больше меньше

}
// более точную картину луча без квадратов
function fixFishEye(distance, angle, playerAngle) {
   const diff = angle - playerAngle;
   return distance * Math.cos(diff);
}

//отбрасывать лучи... и вычисляем растояние при отбрасывании лучей до ближайшего пеаятсвия
function getRays() {
   // начальный угол - который собираемся отбрасывать лучи в ровном направлении
   const initialAngle = player.angle - FOV / 2 // угол игрока - поле/2
   // число лучей - они зависят от ширины экрана  Пр:320 X 240 
   const numberOfRays = SCREEN_WIDTH;
   // шаг угла = постоянный шаг угла равен полю зрения деленное на количество лучей
   const angleStep = FOV / numberOfRays
   // сгенерировать массив
   return Array.from({ length: numberOfRays }, (_, i) => { // Arr фиксируемой длины 
      const angle = initialAngle + i * angleStep;
      const ray = castRay(angle)
      return ray
   })
}
function renderScene(rays) {
   rays.forEach((ray, i) => {
      const distance = fixFishEye(ray.distance, ray.angle, player.angle);
      const wallHeight = ((CELL_SIZE * 5) / distance) * 277;
      context.fillStyle = ray.vertical ? COLORS.wallDark : COLORS.wall;
      context.fillRect(i, SCREEN_HEIGHT / 2 - wallHeight / 2, 1, wallHeight);
      context.fillStyle = COLORS.floor;
      context.fillRect(
         i,
         SCREEN_HEIGHT / 2 + wallHeight / 2,
         1,
         SCREEN_HEIGHT / 2 - wallHeight / 2
      );
      context.fillStyle = COLORS.ceiling;
      context.fillRect(i, 0, 1, SCREEN_HEIGHT / 2 - wallHeight / 2);
   });
}


function renderMinimap(posX = 0, posY = 0, scale, rays) { // тело функции
   const cellSize = scale * CELL_SIZE; // тело ячейки мини-карты (scale- маштабирование)
   //отобразить прокручиваем карту для каждой ячейки ( это будет: строка - row, y- индекс)
   map.forEach((row, y) => { // координату y 
      //показываем что-то в coontex 
      row.forEach((cell, x) => { // координату x
         if (cell) { // else = 1 
            context.fillStyle = 'pink'
            context.fillRect(
               posX  + x * cellSize,
               posY  + y * cellSize,
               cellSize,
               cellSize
            ) // поле реагирует начиная с  postX + x  *  РАЗМЕП ЯЧЕЦКИ
         }
      })  // пробегаем по ячейкам( имеет координату 'x')
   })
   context.fillStyle = '#871ED5'
   context.fillRect(
      posX + player.x * scale - PLAYER_SIZE / 2,
      posY + player.y * scale - PLAYER_SIZE / 2,
      PLAYER_SIZE,
      PLAYER_SIZE)

   //визуализировать луч(rays) который представляет направление
   // const raysLength = PLAYER_SIZE * 2;
   context.strokeStyle = 'violet '; //  style обводки контекста
   context.beginPath()
   context.moveTo(player.x * scale, player.y * scale); // переходим к начальной точки контекста ход( положение инрока) умнажаеи на масштаб
   //визуализируем линию тригонометрия
   context.lineTo(
      (player.x + Math.cos(player.angle) * 20) * scale,
      (player.y + Math.sin(player.angle) * 20) * scale)
   context.closePath()
   context.stroke()

   //визуализируем контекс лучей побочный эффект
   context.strokeStyle = COLORS.rays;
   rays.forEach((ray) => { // rays - расстояние луча
      context.beginPath()
      context.moveTo(player.x * scale, player.y * scale);
      context.lineTo( ///линия конечной точки
      (player.x + Math.cos(ray.angle) * ray.distance) * scale,
      (player.y + Math.sin(ray.angle) * ray.distance) * scale
      )
      context.closePath()
      context.stroke()
   })
}

function gameLoop() {
   clearScreen();//  на каждый Tick выполнять F-ию игрового цикла для очистки экрана и перерисовать его с новым для получения нового значения
   movePlayer(); //мы перемещаем игрока
   const rays = getRays();// вычисляем  затем визуализируя 3D - среду
   renderScene(rays);// визуализируя 3D - среду -- сцену с этими лучами
   renderMinimap(0, 0, 0.75, rays); // 3Dl лучи понадоьяться в miniКарте
}


// преобразование движения в радианы, получать грудусы и использовать формулу
function toRadians(deg) {
   return (deg * Math.PI) / 180

}

setInterval(gameLoop, TICK)  // Tick интервала игрового цикла



//прослушиватели событий 
document.addEventListener('keydown', (e) => {
   if (e.key === "ArrowUp") {
      player.speed = 2
   }
   if (e.key === "ArrowDown") {
      player.speed = -2
   }
})

//на 0 
document.addEventListener('keyup', (e) => {
   if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      player.speed = 0
   }
})
//движение миши
document.addEventListener('mousemove', (e) => {
   // tick для каждого движения будет разница между предыдущей точкой и новой точкой
   // toRadians - теперь можем изменить скорость игрока, теперь усть угол расчитать движение переместить игрока изменить положение x  y
   player.angle += toRadians(e.movementX)
})

























































// let box = 32;

// let score = 0;

// let food = {
//    x: Math.floor((Math.random() * 17 + 1)) * box,// food в случайном месте
// y: Math.floor((Math.random() * 15 + 3)) * box,
// };

// let snake = []; //набор из квадратов(El Arr)
// snake[0] = { // координаты для 1-го El-та
//    x: 9 * box,
//    y: 10 * box
// };

// //Обработчик события
// document.addEventListener('keydown', direction)


// let dir;
// // клавиши на стрелки
// function direction(event) {
//    if (event.keyCode == 37 && dir != 'right')
//       dir = 'left';
//    else if (event.keyCode == 38 && dir != 'down')
//       dir = 'up';
//    else if (event.keyCode == 39 && dir != 'left')
//       dir = 'right';
//    else if (event.keyCode == 40 && dir != 'up')
//       dir = 'down';
// }
// function eatTail(head, arr) {
//    for (let i = 0; i < arr.length; i++) {
//       if (head.x == arr[i].x && head.y == arr[i].y)
//          clearInterval(game)
//    }
// }


// function drawGame() {
//    ctx.drawImage(groundImg, 0, 0)

//    ctx.drawImage(foodImg, food.x, food.y);  // оторажение в случайном месте

//    for (let i = 0; i < snake.length; i++) { // бегу по Arr El змейка
//       ctx.fillStyle = i == 0 ? 'green' : 'red';
//       ctx.fillRect(snake[i].x, snake[i].y, box, box) //создает какой-то Obj квадрат наш
//    }

//    ctx.fillStyle = "white";
//    ctx.font = "50px Arial";
//    ctx.fillText(score, box * 2.5, box * 1.7);

//    let snakeX = snake[0].x;  // --передвижение самой змейки  координаты 1 El по змейки
//    let snakeY = snake[0].y;

//    if (snakeX == food.x && snakeY == food.y) {
//       score++;
//       food = {
//          x: Math.floor((Math.random() * 17 + 1)) * box,
//          y: Math.floor((Math.random() * 15 + 3)) * box,
//       };
//    } else {
//       snake.pop()
//    }
//    if (snakeX < box || snakeX > box * 17 || snakeY < 3 * box || snakeY > box * 17) // если будет за пределами квадрата
//       clearInterval(game)

//    if (dir == 'left') snakeX -= box; // понять на какие клавиши нажать  на 1 box в лево
//    if (dir == 'right') snakeX += box; // увеличивать на один кважрат выше
//    if (dir == 'up') snakeY -= box;
//    if (dir == 'down') snakeY += box;

//    let newHead = { ///новая голова перемещается
//       x: snakeX,
//       y: snakeY
//    }
//    eatTail(newHead, snake);

//    snake.unshift(newHead) /// в Arr помешаем новые координаты которые перемешаются
// }
// let game = setInterval(drawGame, 100);

