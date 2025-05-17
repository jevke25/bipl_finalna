// Main Application Script
document.addEventListener('DOMContentLoaded', () => App.init());


const App = {
    currentUser: null,
    authToken: null,
    currentScreen: null,
    previousScreens: [],
     isNavigatingBack: false, // Flag za praćenje vraćanja
    
    init: function() {
        // Koristi samo 'bipl_user' i 'bipl_auth_token' kao ključeve
        const userData = localStorage.getItem('bipl_user');
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
            } catch (e) {
                console.error('Ne mogu da parsiram podatke o korisniku', e);
                this.currentUser = null;
            }
        }
        const token = localStorage.getItem('bipl_auth_token');
        if (token) {
            this.authToken = token;
            this.checkAuth();
        } else {
            this.showScreen('login-screen');
        }
        this.initEventListeners();
    },
    
    
    initEventListeners: function() {
        // Login form
        document.getElementById('login-form').addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            Auth.login(email, password);
        });
        
        // Register form
        document.getElementById('register-form').addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = {
                email: document.getElementById('register-email').value,
                password: document.getElementById('register-password').value,
                Ime_prezime: document.getElementById('register-name').value,
                Godiste: parseInt(document.getElementById('register-age').value),
                Visina: parseFloat(document.getElementById('register-height').value),
                Tezina: parseFloat(document.getElementById('register-weight').value),
                sportska_istorija: document.getElementById('register-sports-history').value,
                dnevna_aktivnost: document.getElementById('register-activity').value,
                trening_opis: document.getElementById('register-training-desc').value,
                probava_poteskoce: document.getElementById('register-digestion').value,
                stres: document.getElementById('register-stress').value,
                alergije: document.getElementById('register-allergies').value,
                pad_energije: document.getElementById('register-energy').value,
                dijeta_istorija: document.getElementById('register-diet').value,
                menstrualni_ciklus: document.getElementById('register-menstrual').value,
                zdravsteni_problemi: document.getElementById('register-health').value,
                obim_struk: parseFloat(document.getElementById('register-waist').value),
                obim_ramena: parseFloat(document.getElementById('register-shoulders').value),
                obim_noga: parseInt(document.getElementById('register-legs').value),
                cilj: document.getElementById('register-goal').value,
                role: 'client'
            };
            Auth.register(formData);
        });
        
        // Show register screen
        document.getElementById('show-register').addEventListener('click', function(e) {
            e.preventDefault();
            App.showScreen('register-screen');
        });
        
        // Show pricing screen
        document.getElementById('show-pricing').addEventListener('click', function(e) {
            e.preventDefault();
            App.showScreen('pricing-screen');
        });
        
        // Show transformations screen
        document.getElementById('show-transformations').addEventListener('click', function(e) {
            e.preventDefault();
            App.showScreen('transformations-screen');
            Client.loadTransformations();
        });
        
        // Pricing toggle
        document.querySelectorAll('.toggle-option').forEach(option => {
            option.addEventListener('click', function() {
                document.querySelectorAll('.toggle-option').forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');
                
                const months = this.getAttribute('data-months');
                document.querySelectorAll('.pricing-card').forEach(card => {
                    card.classList.remove('active');
                    if (card.getAttribute('data-months') === months) {
                        card.classList.add('active');
                    }
                });
            });
        });
        
        // Back buttons
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                App.goBack();
            });
        });
        
        // Logout button
        document.querySelectorAll('.logout-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                Auth.logout();
            });
        });
        
        // Bottom navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item) {
                item.addEventListener('click', function(e) {
                    e.preventDefault();
                    const screen = this.getAttribute('data-screen');
                    if (screen) App.showScreen(screen);
                });
            }
        });
        
        // Client menu items
        document.querySelectorAll('.client-menu .menu-item').forEach(item => {
            item.addEventListener('click', function() {
                const section = this.getAttribute('data-section');
                Client.showSection(section);
            });
        });
        
        // Trainer menu items
        document.querySelectorAll('.trainer-menu .menu-item').forEach(item => {
            item.addEventListener('click', function() {
                const section = this.getAttribute('data-section');
                Trainer.showSection(section);
            });
        });
        
        // Day selector in training
        document.querySelectorAll('.day-option').forEach(option => {
            option.addEventListener('click', function() {
                if (this.classList.contains('day-option')) {
                    document.querySelectorAll('.day-option').forEach(opt => opt.classList.remove('active'));
                    this.classList.add('active');
                    
                    const day = this.getAttribute('data-day');
                    if (App.currentUser.role === 'client') {
                        Client.loadExercises(day);
                    } else if (App.currentUser.role === 'trainer') {
                        // Trainer adding exercises
                        // Implementation in trainer.js
                    }
                }
            });
        });
        
        // Progress selector
        document.querySelectorAll('.progress-option').forEach(option => {
            option.addEventListener('click', function() {
                document.querySelectorAll('.progress-option').forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');
                
                const type = this.getAttribute('data-type');
                Client.loadProgressChart(type);
            });
        });
        
        // Client filters
        document.querySelectorAll('.filter-option').forEach(option => {
            option.addEventListener('click', function() {
                document.querySelectorAll('.filter-option').forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');
                
                const filter = this.getAttribute('data-filter');
                Trainer.filterClients(filter);
            });
        });
        
        // Understand buttons
        document.querySelectorAll('.btn-understand').forEach(btn => {
            btn.addEventListener('click', function() {
                this.parentElement.style.display = 'none';
            });
        });
        
        // Measurements form
        document.getElementById('measurements-form').addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = {
                cycle: App.currentUser.cycle_count || 1,
                obim_struk: parseFloat(document.getElementById('measurement-waist').value),
                obim_ramena: parseFloat(document.getElementById('measurement-shoulders').value),
                obim_noga: parseInt(document.getElementById('measurement-legs').value),
                tezina: parseFloat(document.getElementById('measurement-weight').value)
            };
            Client.saveMeasurements(formData);
        });
        
        // Nutrition search
        document.getElementById('search-food').addEventListener('click', function() {
            const query = document.getElementById('food-search').value;
            if (query.length > 2) {
                Client.searchFood(query);
            }
        });
        
        // Save meal
        document.getElementById('save-meal').addEventListener('click', function() {
            Client.saveMeal();
        });
        
        // Nutrition date navigation
        document.querySelector('.prev-day').addEventListener('click', function() {
            Client.changeNutritionDate(-1);
        });
        
        document.querySelector('.next-day').addEventListener('click', function() {
            Client.changeNutritionDate(1);
        });
        
        // Edit profile
        document.getElementById('edit-profile').addEventListener('click', function() {
            // Implementation for editing profile
            // This would show a form with current values pre-filled
            Utils.showAlert('Funkcionalnost za izmenu profila će biti dodata u narednoj verziji.', 'info');
        });
        
        // View client progress
        document.getElementById('view-progress').addEventListener('click', function() {
            // Implementation to view client progress
            Utils.showAlert('Funkcionalnost za pregled napretka klijenta će biti dodata u narednoj verziji.', 'info');
        });
    },
  showScreen: function(screenId) {
    console.log('Navigating to screen:', screenId);
    console.log('Previous screens before update:', this.previousScreens);

    if (screenId === this.currentScreen) {
        console.log('Already on this screen, no action taken.');
        return; // Ako je korisnik već na ovom ekranu, ne radi ništa
    }

    if (!this.isNavigatingBack && this.currentScreen) {
        this.previousScreens.push(this.currentScreen); // Dodaj trenutni ekran u istoriju samo ako nije vraćanje
    }

    console.log('Previous screens after update:', this.previousScreens);

    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    const newEl = document.getElementById(screenId);
    if (newEl) {
        newEl.classList.add('active');
        this.currentScreen = screenId;
    }
        
        // Handle bottom navigation
        const allBottomNavs = document.querySelectorAll('.bottom-nav');
        allBottomNavs.forEach(nav => nav.style.display = 'none');
        
        const showBottomBarScreens = [
            'client-dashboard', 'client-profile', 'client-training', 
            'client-measurements', 'client-progress', 'client-nutrition',
            'trainer-dashboard', 'trainer-profile', 'trainer-clients', 
            'trainer-client-details', 'trainer-add-training', 
            'trainer-exercises', 'trainer-add-exercise', 'trainer-stats'
        ];
        
        if (showBottomBarScreens.includes(screenId)) {
            const nav = document.querySelector(`#${screenId} .bottom-nav`);
            if (nav) nav.style.display = '';
        }

        // Load data immediately when showing screens
        if (this.currentUser) {
            if (screenId === 'client-dashboard') {
                const el = document.getElementById('client-name');
                if (el) el.textContent = this.currentUser.Ime_prezime || '-';
                if (typeof Client !== 'undefined' && Client.loadProfile) {
                    Client.loadProfile();
                }
            } else if (screenId === 'trainer-dashboard') {
                const el1 = document.getElementById('trainer-profile-name');
                const el2 = document.getElementById('trainer-profile-email');
                if (el1) el1.textContent = this.currentUser.Ime_prezime || '-';
                if (el2) el2.textContent = this.currentUser.email || '-';
                if (typeof Trainer !== 'undefined' && Trainer.loadStats) {
                    Trainer.loadStats();
                }
            }
        }
    },

goBack: function() {
    console.log('Going back. Previous screens:', this.previousScreens);

    if (this.previousScreens.length > 0) {
        const prevScreen = this.previousScreens.pop();
        console.log('Navigating to previous screen:', prevScreen);
        this.isNavigatingBack = true; // Postavi flag na true
        this.showScreen(prevScreen);
        this.isNavigatingBack = false; // Resetuj flag nakon navigacije
    } else {
        // Ako nema prethodnih ekrana, vrati na dashboard
        const defaultScreen = this.currentUser && this.currentUser.role === 'client' 
            ? 'client-dashboard' 
            : 'trainer-dashboard';
        console.log('No previous screens, navigating to default screen:', defaultScreen);
        this.showScreen(defaultScreen);
    }
},
    resetNavigationHistory: function(targetScreen) {
    this.previousScreens = []; // Resetuje istoriju
    window.history.pushState({}, '', `#${targetScreen}`); // Ažurira URL
},

    checkAuth: function() {
        Utils.showLoading('Proveravanje autentifikacije...');
        
        fetch('https://x8ki-letl-twmt.n7.xano.io/api:rGTwu6BM/auth/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Neuspešna autentifikacija');
            }
            return response.json();
        })
        .then(data => {
            this.currentUser = data;
            localStorage.setItem('bipl_user', JSON.stringify(data));
            this.previousScreens = [];
            
            // Show appropriate screen based on role
            const screenId = data.role === 'client' ? 'client-dashboard' : 'trainer-dashboard';
            this.showScreen(screenId);
            
            Utils.hideLoading();
        })
        .catch(error => {
            console.error('Greška pri proveri autentifikacije:', error);
            localStorage.removeItem('bipl_auth_token');
            localStorage.removeItem('bipl_user');
            this.previousScreens = [];
            this.showScreen('login-screen');
            Utils.hideLoading();
            Utils.showAlert('Sesija je istekla. Molimo prijavite se ponovo.', 'error');
        });
    
    },
    
    handleApiError: function(error) {
        console.error('API greška:', error);
        Utils.hideLoading();
        let msg = 'Došlo je do greške. Molimo pokušajte ponovo.';
        if (error && error.message) msg = error.message;
        if (error && error.response && error.response.data && error.response.data.message) {
            msg = error.response.data.message;
        }
        if (msg === 'Unauthorized') {
            Utils.showAlert('Sesija je istekla. Molimo prijavite se ponovo.', 'error');
            Auth.logout();
        } else {
            Utils.showAlert(msg, 'error');
        }
    }
};