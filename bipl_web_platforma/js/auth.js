const Auth = {
    login: function(email, password) {
        Utils.showLoading('Prijavljivanje...');
        
        fetch('https://x8ki-letl-twmt.n7.xano.io/api:rGTwu6BM/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Neuspešna prijava. Proverite email i šifru.');
            }
            return response.json();
        })
        .then(data => {
            App.authToken = data.authToken;
            App.currentUser = { ...data, role: data.role };
            
            localStorage.setItem('bipl_auth_token', data.authToken);
            localStorage.setItem('bipl_user', JSON.stringify(App.currentUser));
            
            if (data.role === 'client') {
                App.showScreen('client-dashboard');
            } else if (data.role === 'trainer') {
                App.showScreen('trainer-dashboard');
            }
            
            Utils.hideLoading();
        })
        .catch(error => {
            console.error('Greška pri prijavi:', error);
            Utils.hideLoading();
            Utils.showAlert(error.message, 'error');
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