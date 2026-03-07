// Initialize Swiper Slider
document.addEventListener('DOMContentLoaded', () => {
    const swiper = new Swiper('.mySwiper', {
        // Optional parameters
        direction: 'horizontal',
        loop: true,
        autoplay: {
            delay: 3000,
            disableOnInteraction: false, // Continue autoplay after user interactions
            pauseOnMouseEnter: true,     // Pause when mouse is over the slider
        },
        speed: 800, // Smooth transition speed

        // If we need pagination (dots)
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
            // Custom styling for active dots can be handled by swiper's default classes
            // swiper-pagination-bullet-active handles the active state
        },

        // Navigation arrows
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
    });

    // Deal of the Day Countdown Logic
    const initCountdown = () => {
        // Storing target date in localStorage so it persists across page refreshes
        let targetDate = localStorage.getItem('dealEndDate');

        if (!targetDate) {
            // Set end date to ~29 days, 15 hrs, 25 mins, 8 secs from first visit
            const now = new Date();
            now.setDate(now.getDate() + 29);
            now.setHours(now.getHours() + 15);
            now.setMinutes(now.getMinutes() + 25);
            now.setSeconds(now.getSeconds() + 8);
            targetDate = now.getTime();
            localStorage.setItem('dealEndDate', targetDate);
        } else {
            targetDate = parseInt(targetDate, 10);
        }

        const updateTimer = () => {
            const now = new Date().getTime();
            const distance = targetDate - now;

            // Reset logic if countdown finishes
            if (distance < 0) {
                localStorage.removeItem('dealEndDate');
                return;
            }

            // Calculations
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            // Update DOM (Check if elements exist on page first)
            const daysEl = document.getElementById('days');
            const hoursEl = document.getElementById('hours');
            const minutesEl = document.getElementById('minutes');
            const secondsEl = document.getElementById('seconds');

            if (daysEl) daysEl.innerText = days.toString().padStart(2, '0');
            if (hoursEl) hoursEl.innerText = hours.toString().padStart(2, '0');
            if (minutesEl) minutesEl.innerText = minutes.toString().padStart(2, '0');
            if (secondsEl) secondsEl.innerText = seconds.toString().padStart(2, '0');
        };

        // Run immediately to avoid 1-second delay
        updateTimer();
        // Update every 1 second
        setInterval(updateTimer, 1000);
    };

    // Initialize Countdown
    initCountdown();
});
