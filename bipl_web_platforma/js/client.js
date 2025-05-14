const Client = {
    currentDay: 1,
    currentNutritionDate: new Date(),
    selectedFoods: [],
    
    showSection: function(section) {
        switch(section) {
            case 'training':
                App.showScreen('client-training');
                this.loadExercises(this.currentDay);
                break;
            case 'measurements':
                App.showScreen('client-measurements');
                break;
            case 'progress':
                App.showScreen('client-progress');
                this.loadProgressChart('weight');
                break;
            case 'contact':
                window.open('https://wa.me/381695519399', '_blank');
                break;
            case 'record':
                window.open('https://wa.me/381695519399', '_blank');
                break;
            case 'nutrition':
                App.showScreen('client-nutrition');
                this.loadNutritionData();
                break;
            default:
                console.log('Nepoznata sekcija:', section);
        }
    },
    
    loadExercises: function(day) {
        Utils.showLoading('Učitavanje treninga...');
        this.currentDay = day;
        if (!App.currentUser || !App.currentUser.id) {
            Utils.showAlert('Nedostaje ID korisnika!', 'error');
            Utils.hideLoading();
            return;
        }
        fetch(`https://x8ki-letl-twmt.n7.xano.io/api:-VqLpohl/training?user_id=${App.currentUser.id}&day=${day}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${App.authToken}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) throw new Error('Greška pri učitavanju treninga');
            return response.json();
        })
        .then(data => {
            const container = document.querySelector('.exercises-container');
            if (!container) return;
            container.innerHTML = '';
            const exercises = Array.isArray(data) ? data : [];
            if (exercises.length === 0) {
                container.innerHTML = '<p>Nema treninga za ovaj dan. Kontaktirajte trenera.</p>';
                Utils.hideLoading();
                return;
            }
            const groups = {};
            exercises.forEach(exercise => {
                if (!groups[exercise.grupa_misica]) {
                    groups[exercise.grupa_misica] = [];
                }
                groups[exercise.grupa_misica].push(exercise);
            });
            for (const group in groups) {
                const groupElement = document.createElement('div');
                groupElement.className = 'exercise-group';
                const groupTitle = document.createElement('h4');
                groupTitle.textContent = group;
                groupElement.appendChild(groupTitle);
                groups[group].forEach(exercise => {
                    const exerciseElement = document.createElement('div');
                    exerciseElement.className = 'exercise-item';
                    exerciseElement.innerHTML = `
                        <div class="exercise-info">
                            <h5>${exercise.naziv_vezbe}</h5>
                            <p>${exercise.sets} serija × ${exercise.repetitions} ponavljanja</p>
                        </div>
                        <div class="exercise-actions">
                            <button class="play-btn" data-video="${exercise.video_link}">
                                <i class="fas fa-play"></i>
                            </button>
                        </div>
                    `;
                    groupElement.appendChild(exerciseElement);
                });
                container.appendChild(groupElement);
            }
            document.querySelectorAll('.play-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const videoUrl = this.getAttribute('data-video');
                    window.open(videoUrl, '_blank');
                });
            });
            Utils.hideLoading();
        })
        .catch(error => {
            console.error('Greška:', error);
            Utils.hideLoading();
            App.handleApiError(error);
        });
    },
    
    saveMeasurements: function(data) {
        Utils.showLoading('Čuvanje obima...');
        
        fetch('https://x8ki-letl-twmt.n7.xano.io/api:-VqLpohl/measurements', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${App.authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...data,
                user_id: App.currentUser.id
            })
        })
        .then(response => {
            if (!response.ok) throw new Error('Greška pri čuvanju obima');
            return response.json();
        })
        .then(() => {
            Utils.hideLoading();
            Utils.showAlert('Obimi uspešno sačuvani!', 'success');
            document.getElementById('measurements-form').reset();
            
            // Update user's cycle count
            if (App.currentUser.cycle_count) {
                App.currentUser.cycle_count += 1;
            } else {
                App.currentUser.cycle_count = 2;
            }
            localStorage.setItem('bipl_user', JSON.stringify(App.currentUser));
        })
        .catch(error => {
            console.error('Greška:', error);
            Utils.hideLoading();
            App.handleApiError(error);
        });
    },
    
    loadProgressChart: function(type) {
        Utils.showLoading('Učitavanje napretka...');
        
        fetch(`https://x8ki-letl-twmt.n7.xano.io/api:-VqLpohl/measurements?user_id=${App.currentUser.id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${App.authToken}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) throw new Error('Greška pri učitavanju napretka');
            return response.json();
        })
        .then(data => {
            if (data.length === 0) {
                document.querySelector('.chart-container').innerHTML = '<p>Nema podataka o napretku. Unesite svoje obime da biste pratili napredak.</p>';
                Utils.hideLoading();
                return;
            }
            
            // Sort data by cycle
            data.sort((a, b) => a.cycle - b.cycle);
            
            // Prepare chart data
            const labels = data.map(item => `Nedelja ${item.cycle}`);
            let values, title, unit;
            
            switch(type) {
                case 'weight':
                    values = data.map(item => item.tezina);
                    title = 'Težina (kg)';
                    unit = 'kg';
                    break;
                case 'waist':
                    values = data.map(item => item.obim_struk);
                    title = 'Obim struka (cm)';
                    unit = 'cm';
                    break;
                case 'shoulders':
                    values = data.map(item => item.obim_ramena);
                    title = 'Obim ramena (cm)';
                    unit = 'cm';
                    break;
                case 'legs':
                    values = data.map(item => item.obim_noga);
                    title = 'Obim nogu (cm)';
                    unit = 'cm';
                    break;
            }
            
            // Update summary
            document.getElementById('start-weight').textContent = `${data[0].tezina} kg`;
            document.getElementById('current-weight').textContent = `${data[data.length - 1].tezina} kg`;
            
            const weightChange = data[data.length - 1].tezina - data[0].tezina;
            const weightChangeElement = document.getElementById('weight-change');
            weightChangeElement.textContent = `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg`;
            weightChangeElement.style.color = weightChange < 0 ? '#4CAF50' : '#F44336';
            
            // Create or update chart
            const ctx = document.getElementById('progress-chart').getContext('2d');
            
            if (window.progressChart) {
                window.progressChart.data.labels = labels;
                window.progressChart.data.datasets[0].data = values;
                window.progressChart.data.datasets[0].label = title;
                window.progressChart.update();
            } else {
                window.progressChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: title,
                            data: values,
                            borderColor: '#eb7d00',
                            backgroundColor: 'rgba(235, 125, 0, 0.1)',
                            tension: 0.3,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'top',
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return `${context.dataset.label}: ${context.parsed.y} ${unit}`;
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: false
                            }
                        }
                    }
                });
            }
            
            Utils.hideLoading();
        })
        .catch(error => {
            console.error('Greška:', error);
            Utils.hideLoading();
            App.handleApiError(error);
        });
    },
    
    loadProfile: function() {
        const user = App.currentUser || {};
        const elName = document.getElementById('profile-name');
        if (elName) elName.textContent = user.Ime_prezime || '-';
        const elEmail = document.getElementById('profile-email');
        if (elEmail) elEmail.textContent = user.email || '-';
        const elAge = document.getElementById('profile-age');
        if (elAge) elAge.textContent = user.Godiste || '-';
        const elHeight = document.getElementById('profile-height');
        if (elHeight) elHeight.textContent = user.Visina ? `${user.Visina} cm` : '-';
        const elWeight = document.getElementById('profile-weight');
        if (elWeight) elWeight.textContent = user.Tezina ? `${user.Tezina} kg` : '-';
        const elGoal = document.getElementById('profile-goal');
        if (elGoal) elGoal.textContent = user.cilj || '-';
        let status = '';
        if (user.has_paid) {
            status += 'Uplata potvrđena';
        } else {
            status += 'Čeka se uplata';
        }
        status += ' • ';
        if (user.has_Training) {
            status += 'Trening dostupan';
        } else {
            status += 'Čeka se trening';
        }
        const elStatus = document.getElementById('profile-status');
        if (elStatus) elStatus.textContent = status;
    },
    
    loadTransformations: function() {
        const container = document.querySelector('.transformations-grid');
        container.innerHTML = '';
        
        // Load 10 transformation images
        for (let i = 1; i <= 10; i++) {
            const item = document.createElement('div');
            item.className = 'transformation-item';
            item.innerHTML = `<img src="images/transformations/${i}.jpg" alt="Transformacija ${i}">`;
            container.appendChild(item);
        }
    },
    
    searchFood: function(query) {
        Utils.showLoading('Pretraga hrane...');
        
        fetch(`https://x8ki-letl-twmt.n7.xano.io/api:-VqLpohl/foods?name=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${App.authToken}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) throw new Error('Greška pri pretrazi hrane');
            return response.json();
        })
        .then(data => {
            const container = document.querySelector('.food-results');
            container.innerHTML = '';
            
            if (data.length === 0) {
                container.innerHTML = '<p>Nema rezultata za ovu pretragu.</p>';
                Utils.hideLoading();
                return;
            }
            
            data.forEach(food => {
                const item = document.createElement('div');
                item.className = 'food-item';
                item.innerHTML = `
                    <h4>${food.name}</h4>
                    <p>${food.calories} kcal • ${food.protein}g proteina • ${food.carbs}g UH • ${food.fat}g masti</p>
                `;
                
                item.addEventListener('click', () => {
                    this.addSelectedFood(food);
                });
                
                container.appendChild(item);
            });
            
            Utils.hideLoading();
        })
        .catch(error => {
            console.error('Greška:', error);
            Utils.hideLoading();
            App.handleApiError(error);
        });
    },
    
    addSelectedFood: function(food) {
        // Check if food is already selected
        const existingIndex = this.selectedFoods.findIndex(f => f.id === food.id);
        if (existingIndex >= 0) {
            Utils.showAlert('Namirnica je već dodata!', 'warning');
            return;
        }
        this.selectedFoods.push({
            ...food,
            quantity: 1
        });
        this.updateSelectedFoodsList();
        Utils.showAlert('Namirnica uspešno dodata!', 'success');
    },
    
    updateSelectedFoodsList: function() {
        const container = document.querySelector('.selected-list');
        if (!container) return;
        container.innerHTML = '';
        if (!this.selectedFoods || this.selectedFoods.length === 0) {
            container.innerHTML = '<p>Niste odabrali nijednu namirnicu.</p>';
            return;
        }
        this.selectedFoods.forEach((food, index) => {
            const item = document.createElement('div');
            item.className = 'selected-food';
            item.innerHTML = `
                <div class="selected-food-info">
                    <h4>${food.name}</h4>
                    <p>${food.calories} kcal • ${food.protein}g proteina • ${food.carbs}g UH • ${food.fat}g masti</p>
                </div>
                <div class="selected-food-quantity">
                    <input type="number" min="1" value="${food.quantity}" data-index="${index}">
                    <span class="remove-food" data-index="${index}"><i class="fas fa-times"></i></span>
                </div>
            `;
            container.appendChild(item);
        });
        // Add event listeners to quantity inputs
        document.querySelectorAll('.selected-list input').forEach(input => {
            input.addEventListener('change', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                const val = parseInt(e.target.value);
                if (val <= 0) {
                    Utils.showAlert('Količina mora biti veća od 0!', 'error');
                    e.target.value = 1;
                    this.selectedFoods[index].quantity = 1;
                } else {
                    this.selectedFoods[index].quantity = val;
                }
            });
        });
        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-food').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.getAttribute('data-index'));
                this.selectedFoods.splice(index, 1);
                this.updateSelectedFoodsList();
            });
        });
    },
    
    saveMeal: function() {
        if (!this.selectedFoods || this.selectedFoods.length === 0) {
            Utils.showAlert('Morate odabrati barem jednu namirnicu.', 'error');
            return;
        }
        if (this.selectedFoods.some(f => f.quantity <= 0)) {
            Utils.showAlert('Količina svake namirnice mora biti veća od 0!', 'error');
            return;
        }
        Utils.showLoading('Čuvanje obroka...');
        const date = this.formatDate(this.currentNutritionDate);
        const entries = this.selectedFoods.map(food => ({
            food_id: food.id,
            quantity: food.quantity,
            date: date
        }));
        const promises = entries.map(entry => {
            return fetch('https://x8ki-letl-twmt.n7.xano.io/api:-VqLpohl/food_entries', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${App.authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...entry,
                    user_id: App.currentUser.id
                })
            });
        });
        Promise.all(promises)
        .then(() => {
            this.selectedFoods = [];
            this.updateSelectedFoodsList();
            const foodSearch = document.getElementById('food-search');
            if (foodSearch) foodSearch.value = '';
            const foodResults = document.querySelector('.food-results');
            if (foodResults) foodResults.innerHTML = '';
            this.loadNutritionData();
            Utils.hideLoading();
            Utils.showAlert('Obrok uspešno sačuvan!', 'success');
        })
        .catch(error => {
            Utils.hideLoading();
            let msg = 'Došlo je do greške. Molimo pokušajte ponovo.';
            if (error && error.message) msg = error.message;
            Utils.showAlert(msg, 'error');
        });
    },
    
    loadNutritionData: function() {
        Utils.showLoading('Učitavanje podataka o ishrani...');
        
        const date = this.formatDate(this.currentNutritionDate);
        document.querySelector('.current-date').textContent = this.formatDateForDisplay(this.currentNutritionDate);
        
        fetch(`https://x8ki-letl-twmt.n7.xano.io/api:-VqLpohl/food_entries?user_id=${App.currentUser.id}&date=${date}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${App.authToken}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) throw new Error('Greška pri učitavanju podataka o ishrani');
            return response.json();
        })
        .then(data => {
            // Group entries by meal time (we'll assume all are from today for simplicity)
            const meals = {};
            
            data.forEach(entry => {
                if (!meals[entry.meal_time]) {
                    meals[entry.meal_time] = [];
                }
                meals[entry.meal_time].push(entry);
            });
            
            // Display meals
            const container = document.querySelector('.meals-list');
            container.innerHTML = '';
            
            if (Object.keys(meals).length === 0) {
                container.innerHTML = '<p>Nema unosa hrane za ovaj dan.</p>';
                this.updateNutritionSummary({});
                Utils.hideLoading();
                return;
            }
            
            // Calculate totals
            let totalCalories = 0;
            let totalProtein = 0;
            let totalCarbs = 0;
            let totalFat = 0;
            
            for (const time in meals) {
                const mealItem = document.createElement('div');
                mealItem.className = 'meal-item';
                
                let mealCalories = 0;
                let mealProtein = 0;
                let mealCarbs = 0;
                let mealFat = 0;
                
                let foodsHtml = '';
                
                meals[time].forEach(entry => {
                    const calories = entry.food.calories * entry.quantity;
                    const protein = entry.food.protein * entry.quantity;
                    const carbs = entry.food.carbs * entry.quantity;
                    const fat = entry.food.fat * entry.quantity;
                    
                    mealCalories += calories;
                    mealProtein += protein;
                    mealCarbs += carbs;
                    mealFat += fat;
                    
                    totalCalories += calories;
                    totalProtein += protein;
                    totalCarbs += carbs;
                    totalFat += fat;
                    
                    foodsHtml += `
                        <li class="meal-food">
                            <span class="meal-food-name">${entry.food.name} (${entry.quantity} ${entry.food.portion_size})</span>
                            <span class="meal-food-values">
                                <span>${calories.toFixed(0)} kcal</span>
                                <span>${protein.toFixed(1)}g P</span>
                                <span>${carbs.toFixed(1)}g UH</span>
                                <span>${fat.toFixed(1)}g M</span>
                            </span>
                        </li>
                    `;
                });
                
                mealItem.innerHTML = `
                    <div class="meal-header">
                        <span class="meal-time">${time}</span>
                        <span class="meal-calories">${mealCalories.toFixed(0)} kcal</span>
                    </div>
                    <ul class="meal-foods">${foodsHtml}</ul>
                `;
                
                container.appendChild(mealItem);
            }
            
            // Update summary
            this.updateNutritionSummary({
                calories: totalCalories,
                protein: totalProtein,
                carbs: totalCarbs,
                fat: totalFat
            });
            
            Utils.hideLoading();
        })
        .catch(error => {
            console.error('Greška:', error);
            Utils.hideLoading();
            App.handleApiError(error);
        });
    },
    
    updateNutritionSummary: function({calories = 0, protein = 0, carbs = 0, fat = 0}) {
        // Update calories circle
        const calorieGoal = 2500; // Default goal, could be customized per user
        const caloriePercent = Math.min(100, (calories / calorieGoal) * 100);
        
        const circle = document.querySelector('.progress-circle');
        circle.style.background = `conic-gradient(var(--primary-color) ${caloriePercent}%, transparent ${caloriePercent}%)`;
        circle.querySelector('.progress-value').textContent = Math.round(calories);
        
        // Update other values
        document.querySelectorAll('.summary-card .progress-value').forEach(el => {
            if (el.parentElement.querySelector('h3').textContent === 'Proteini') {
                el.textContent = `${protein.toFixed(1)}g`;
            } else if (el.parentElement.querySelector('h3').textContent === 'Ugljeni hidrati') {
                el.textContent = `${carbs.toFixed(1)}g`;
            } else if (el.parentElement.querySelector('h3').textContent === 'Masti') {
                el.textContent = `${fat.toFixed(1)}g`;
            }
        });
    },
    
    changeNutritionDate: function(days) {
        this.currentNutritionDate = new Date(this.currentNutritionDate);
        this.currentNutritionDate.setDate(this.currentNutritionDate.getDate() + days);
        this.loadNutritionData();
    },
    
    formatDate: function(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
    
    formatDateForDisplay: function(date) {
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        return new Date(date).toLocaleDateString('sr-RS', options);
    }
};