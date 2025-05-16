const Utils = {
    showLoading: function(message = 'Učitavanje...') {
        document.getElementById('overlay').style.display = 'flex';
        document.getElementById('overlay-message').textContent = message;
    },
    
    hideLoading: function() {
        document.getElementById('overlay').style.display = 'none';
    },
    
    showAlert: function(message, type = 'info') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        
        // Add some basic styling
        alert.style.position = 'fixed';
        alert.style.top = '20px';
        alert.style.right = '20px';
        alert.style.padding = '15px';
        alert.style.borderRadius = '5px';
        alert.style.color = '#fff';
        alert.style.zIndex = '1000';
        alert.style.maxWidth = '300px';
        alert.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.3)';
        
        switch(type) {
            case 'success':
                alert.style.backgroundColor = '#4CAF50';
                break;
            case 'error':
                alert.style.backgroundColor = '#F44336';
                break;
            case 'warning':
                alert.style.backgroundColor = '#FF9800';
                break;
            default:
                alert.style.backgroundColor = '#2196F3';
        }
        
        document.body.appendChild(alert);
        Utils.checkApiResponse = function(response) {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.message || 'Došlo je do greške na serveru');
                });
            }
            return response.json();
        };
        // Auto-remove after 5 seconds
        setTimeout(() => {
            alert.style.opacity = '0';
            alert.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                document.body.removeChild(alert);
            }, 500);
        }, 5000);
    },
    
    debounce: function(func, wait, immediate) {
        let timeout;
        return function() {
            const context = this, args = arguments;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    },
    
    formatDate: function(date) {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}.${month}.${year}.`;
    }
};