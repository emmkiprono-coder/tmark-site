/* ============================================
   TMARK - Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // --- Navbar Scroll Effect ---
    const navbar = document.getElementById('navbar');
    const backToTop = document.getElementById('backToTop');

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;

        // Navbar background
        if (scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Back to top button
        if (scrollY > 500) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }

        // Update active nav link
        updateActiveNav();
    });

    // Back to top click
    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // --- Mobile Navigation ---
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });

    // Close mobile menu on link click
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // --- Active Navigation Link ---
    function updateActiveNav() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPos = window.scrollY + 150;

        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');
            const link = document.querySelector(`.nav-link[href="#${id}"]`);

            if (link) {
                if (scrollPos >= top && scrollPos < top + height) {
                    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                }
            }
        });
    }

    // --- Hero Stats Counter Animation ---
    const statNumbers = document.querySelectorAll('.stat-number');
    let statsCounted = false;

    function animateStats() {
        if (statsCounted) return;

        const heroSection = document.querySelector('.hero');
        const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;

        if (window.scrollY + window.innerHeight > heroSection.offsetTop + 200) {
            statsCounted = true;

            statNumbers.forEach(stat => {
                const target = parseInt(stat.getAttribute('data-target'));
                const duration = 2000;
                const step = target / (duration / 16);
                let current = 0;

                const timer = setInterval(() => {
                    current += step;
                    if (current >= target) {
                        current = target;
                        clearInterval(timer);
                    }
                    stat.textContent = Math.floor(current);
                }, 16);
            });
        }
    }

    window.addEventListener('scroll', animateStats);
    animateStats(); // Check on load

    // --- Fleet Filter ---
    const filterBtns = document.querySelectorAll('.filter-btn');
    const fleetCards = document.querySelectorAll('.fleet-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');

            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Filter cards
            fleetCards.forEach(card => {
                const category = card.getAttribute('data-category');
                if (filter === 'all' || category === filter) {
                    card.classList.remove('hidden');
                    card.style.animation = 'fadeInUp 0.4s ease forwards';
                } else {
                    card.classList.add('hidden');
                }
            });
        });
    });

    // --- Experiences Filter ---
    const expFilterBtns = document.querySelectorAll('.exp-filter-btn');
    const expCards = document.querySelectorAll('.experience-card');

    expFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-exp-filter');

            // Update active button
            expFilterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Filter cards
            expCards.forEach(card => {
                const category = card.getAttribute('data-exp-category');
                if (filter === 'all' || category === filter) {
                    card.classList.remove('hidden');
                    card.style.animation = 'fadeInUp 0.4s ease forwards';
                } else {
                    card.classList.add('hidden');
                }
            });
        });
    });

    // --- Passport Filter ---
    const passportFilterBtns = document.querySelectorAll('[data-passport-filter]');
    const passportStamps = document.querySelectorAll('.passport-stamp');

    passportFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-passport-filter');

            passportFilterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            passportStamps.forEach(stamp => {
                const category = stamp.getAttribute('data-passport-category');
                if (filter === 'all' || category === filter) {
                    stamp.classList.remove('hidden');
                    stamp.style.animation = 'fadeInUp 0.4s ease forwards';
                } else {
                    stamp.classList.add('hidden');
                }
            });
        });
    });

    // --- Testimonials Slider ---
    const track = document.getElementById('testimonialsTrack');
    const prevBtn = document.getElementById('testimonialPrev');
    const nextBtn = document.getElementById('testimonialNext');
    const dotsContainer = document.getElementById('testimonialDots');
    const testimonials = track.querySelectorAll('.testimonial-card');
    let currentSlide = 0;
    let autoSlideTimer;

    // Create dots
    testimonials.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.classList.add('testimonial-dot');
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
    });

    function goToSlide(index) {
        currentSlide = index;
        track.style.transform = `translateX(-${currentSlide * 100}%)`;

        // Update dots
        document.querySelectorAll('.testimonial-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === currentSlide);
        });

        // Reset auto slide
        clearInterval(autoSlideTimer);
        startAutoSlide();
    }

    function nextSlide() {
        goToSlide((currentSlide + 1) % testimonials.length);
    }

    function prevSlide() {
        goToSlide((currentSlide - 1 + testimonials.length) % testimonials.length);
    }

    nextBtn.addEventListener('click', nextSlide);
    prevBtn.addEventListener('click', prevSlide);

    // Auto slide
    function startAutoSlide() {
        autoSlideTimer = setInterval(nextSlide, 5000);
    }
    startAutoSlide();

    // Pause on hover
    track.addEventListener('mouseenter', () => clearInterval(autoSlideTimer));
    track.addEventListener('mouseleave', startAutoSlide);

    // Touch/swipe support
    let touchStartX = 0;
    let touchEndX = 0;

    track.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        clearInterval(autoSlideTimer);
    }, { passive: true });

    track.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) nextSlide();
            else prevSlide();
        }
        startAutoSlide();
    }, { passive: true });

    // --- FAQ Accordion ---
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            // Close all
            faqItems.forEach(i => i.classList.remove('active'));

            // Open clicked if it wasn't active
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    // --- Booking Form ---
    const bookingForm = document.getElementById('bookingForm');
    const bookingSuccess = document.getElementById('bookingSuccess');

    if (bookingForm) {
        // Set min date to today
        const eventDate = document.getElementById('eventDate');
        if (eventDate) {
            const today = new Date().toISOString().split('T')[0];
            eventDate.setAttribute('min', today);
        }

        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Simple validation
            const required = bookingForm.querySelectorAll('[required]');
            let valid = true;

            required.forEach(field => {
                if (!field.value.trim()) {
                    field.style.borderColor = '#e53e3e';
                    valid = false;
                } else {
                    field.style.borderColor = '';
                }
            });

            if (valid) {
                // Show success message
                bookingForm.style.display = 'none';
                bookingSuccess.style.display = 'block';

                // Scroll to success message
                bookingSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });

        // Clear error styling on input
        bookingForm.querySelectorAll('input, select, textarea').forEach(field => {
            field.addEventListener('input', () => {
                field.style.borderColor = '';
            });
        });
    }

    // --- Scroll Animations (Intersection Observer) ---
    const observerOptions = {
        root: null,
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Add fade-in class to elements
    const animateElements = document.querySelectorAll(
        '.service-card, .fleet-card, .experience-card, .pricing-card, .contact-card, .faq-item, .about-feature, .gallery-item, .passport-stamp, .passport-reward-card'
    );

    animateElements.forEach((el, index) => {
        el.classList.add('fade-in');
        el.style.transitionDelay = `${(index % 6) * 0.1}s`;
        observer.observe(el);
    });

    // --- Smooth scroll for all anchor links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

});

// --- CSS Animation Keyframes (injected) ---
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);
