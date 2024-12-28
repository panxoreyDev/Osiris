
//-------------------Creacion de estrellas en el log in




document.addEventListener("DOMContentLoaded", () => {
    // Asegúrate de que el contenedor del fondo exista en el DOM
    const background = document.querySelector('.dynamic-background');
    if (!background) {
        console.error("El contenedor '.dynamic-background' no se encontró.");
        return; // Detiene la ejecución si no se encuentra el contenedor
    }

    const numberOfStars = 100; // Cantidad de estrellas

    for (let i = 0; i < numberOfStars; i++) {
        const star = document.createElement('div');
        star.classList.add('star');

        // Tamaño aleatorio
        const size = Math.random() * 3 + 1; // Entre 1px y 4px
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;

        // Posición inicial aleatoria
        star.style.left = `${Math.random() * 100}vw`;
        star.style.top = `${Math.random() * 100}vh`;

        // Duraciones y retardo aleatorios
        const twinkleDuration = Math.random() * 3 + 2; // Entre 2s y 5s
        const moveDuration = Math.random() * 15 + 10; // Entre 10s y 25s
        const delay = Math.random() * 5; // Retraso aleatorio

        // Desplazamiento aleatorio
        const dx = Math.random() * 200 - 100; // Horizontal
        const dy = Math.random() * 200 - 100; // Vertical
        star.style.setProperty('--dx', dx);
        star.style.setProperty('--dy', dy);

        // Configuración de animaciones
        star.style.animation = `twinkle ${twinkleDuration}s ease-in-out infinite, move ${moveDuration}s ease-in-out infinite`;
        star.style.animationDelay = `${delay}s`;

        background.appendChild(star);
    }
});
