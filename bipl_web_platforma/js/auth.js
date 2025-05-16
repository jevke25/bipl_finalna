const Auth = {
login: function(email, password) {
    Utils.showLoading('Prijavljivanje...');
    
    fetch('https://x8ki-letl-twmt.n7.xano.io/api:rGTwu6BM/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.message || 'Neuspešna prijava');
            });
        }
        return response.json();
    })
    .then(data => {
        // Postavi korisničke podatke i token
        App.authToken = data.authToken;
        App.currentUser = data.user;
        
        // Sačuvaj podatke u localStorage
        localStorage.setItem('bipl_auth_token', data.authToken);
        localStorage.setItem('bipl_user', JSON.stringify(data.user));
        
        // Učitaj podatke pre prikazivanja ekrana
        if (data.user.role === 'client') {
            Client.loadProfile(); // Pozovi direktno
            App.showScreen('client-dashboard');
        } else if (data.user.role === 'trainer') {
            Trainer.loadStats(); // Pozovi direktno
            App.showScreen('trainer-dashboard');
        }
        
        Utils.hideLoading();
    })
    .catch(error => {
        console.error('Login error:', error);
        Utils.hideLoading();
        Utils.showAlert(error.message || 'Neuspešna prijava. Proverite email i lozinku.', 'error');
    });
    },
    
    register: function(formData) {
        Utils.showLoading('Registracija u toku...');
        
        fetch('https://x8ki-letl-twmt.n7.xano.io/api:rGTwu6BM/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.message || 'Došlo je do greške prilikom registracije.'); });
            }
            return response.json();
        })
        .then(data => {
            Utils.hideLoading();
            Utils.showAlert('Uspešno ste se registrovali! Sada se možete prijaviti.', 'success');
            App.showScreen('login-screen');
        })
        .catch(error => {
            console.error('Greška pri registraciji:', error);
            Utils.hideLoading();
            Utils.showAlert(error.message, 'error');
        });
    },
    
    logout: function() {
        localStorage.removeItem('bipl_auth_token');
        localStorage.removeItem('bipl_user');
        App.authToken = null;
        App.currentUser = null;
        App.previousScreens = [];
        App.showScreen('login-screen');
    }
};