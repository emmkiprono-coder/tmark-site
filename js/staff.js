/* ============================================
   TMARK - Staff Portal JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // --- Smooth Scrolling for Anchor Links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const navHeight = document.querySelector('.staff-navbar')?.offsetHeight || 70;
                const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Close mobile menu if open
                const navToggle = document.getElementById('navToggle');
                const navMenu = document.getElementById('navMenu');
                if (navToggle && navMenu) {
                    navToggle.classList.remove('active');
                    navMenu.classList.remove('active');
                    document.body.style.overflow = '';
                }
            }
        });
    });

    // --- Section Navigation Link Highlighting ---
    const staffNavLinks = document.querySelectorAll('.staff-nav-link:not(.staff-back-link)');
    const sections = document.querySelectorAll('section[id]');

    function updateActiveNavLink() {
        const scrollPos = window.scrollY + 150;

        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');

            // Find matching nav link
            const link = document.querySelector(`.staff-nav-link[href="#${id}"]`);
            if (link) {
                if (scrollPos >= top && scrollPos < top + height) {
                    staffNavLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                }
            }
        });
    }

    window.addEventListener('scroll', updateActiveNavLink);
    updateActiveNavLink();

    // --- Training Checklist Toggle ---
    const checkboxes = document.querySelectorAll('.checklist-checkbox');

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            // The visual toggle is handled by CSS via :checked pseudo-class
            // This handler can be used for any additional logic (e.g., progress tracking)

            // Count checked items within the same training card
            const card = this.closest('.training-card');
            if (card) {
                const total = card.querySelectorAll('.checklist-checkbox').length;
                const checked = card.querySelectorAll('.checklist-checkbox:checked').length;

                // Optional: Update status badge based on completion
                const statusBadge = card.querySelector('.training-status');
                if (statusBadge && checked === total) {
                    statusBadge.textContent = 'Complete';
                    statusBadge.className = 'training-status current';
                }
            }
        });
    });

    // --- Mobile Navigation Toggle (for staff navbar) ---
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        });

        // Close mobile menu on link click
        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
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

    // Add fade-in animations to cards
    const animateElements = document.querySelectorAll(
        '.comms-card, .training-card'
    );

    animateElements.forEach((el, index) => {
        el.classList.add('fade-in');
        el.style.transitionDelay = `${(index % 4) * 0.1}s`;
        observer.observe(el);
    });

});
