const Trainer = {
    currentClient: null,
    selectedExercises: [],
    trainingDays: [1,2,3,4,5],
    selectedDay: 1,
    selectedGroup: '',
    selectedExercise: null,
    dayExercises: {1:[],2:[],3:[],4:[],5:[]},
    
   showSection: function(section) {
    switch(section) {
        case 'clients':
            App.showScreen('trainer-clients');
            this.filterClients('all');
            App.resetNavigationHistory('trainer-clients'); // Resetovanje istorije
            break;
        case 'exercises':
            App.showScreen('trainer-exercises');
            this.loadExercises();
            App.resetNavigationHistory('trainer-exercises'); // Resetovanje istorije
            break;
        case 'stats':
            App.showScreen('trainer-stats');
            this.loadStats();
            App.resetNavigationHistory('trainer-stats'); // Resetovanje istorije
            break;
        default:
            console.log('Nepoznata sekcija:', section);
    }
},
    
    filterClients: function(filter) {
        Utils.showLoading('Učitavanje klijenata...');
        
        fetch('https://x8ki-letl-twmt.n7.xano.io/api:-VqLpohl/user?role=client', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${App.authToken}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            let filtered = data;
            if (filter === 'active') {
                filtered = data.filter(c => c.has_paid && c.has_Training);
            } else if (filter === 'pending-payment') {
                filtered = data.filter(c => !c.has_paid);
            } else if (filter === 'pending-training') {
                filtered = data.filter(c => c.has_paid && !c.has_Training);
            }
            const container = document.querySelector('.clients-list');
            container.innerHTML = '';
            if (filtered.length === 0) {
                container.innerHTML = '<p>Nema klijenata za ovaj filter.</p>';
                Utils.hideLoading();
                return;
            }
            filtered.forEach(client => {
                const card = document.createElement('div');
                card.className = 'client-card';
                card.innerHTML = `
                    <h3>${client.Ime_prezime}</h3>
                    <p>${client.email}</p>
                    <div class="client-status">
                        <span class="payment-status">${client.has_paid ? 'Uplaćeno' : 'Čeka uplatu'}</span>
                        <span class="training-status">${client.has_Training ? 'Trening dostupan' : 'Čeka trening'}</span>
                    </div>
                `;
                
                card.addEventListener('click', () => {
                    this.showClientDetails(client);
                });
                
                container.appendChild(card);
            });
            
            Utils.hideLoading();
        })
        .catch(error => {
            console.error('Greška:', error);
            Utils.hideLoading();
            App.handleApiError(error);
        });
    },
    populateExerciseGroupFilter: function() {
    const groupFilter = document.getElementById('exercise-group-filter');
    if (!groupFilter) return;

    // Resetuj dropdown
    groupFilter.innerHTML = '<option value="">Sve grupe</option>';

    // Pronađi jedinstvene grupe mišića
    const groups = [...new Set((Trainer.allExercises || []).map(ex => ex.grupa_misica))];

    // Popuni dropdown sa grupama
    groups.forEach(group => {
        groupFilter.innerHTML += `<option value="${group}">${group}</option>`;
    });

    // Dodaj event listener za filtriranje
    groupFilter.onchange = function() {
        const selectedGroup = this.value;
        Trainer.filterExercisesByGroup(selectedGroup);
    };
},
filterExercisesByGroup: function(group) {
    const container = document.querySelector('.exercises-list');
    if (!container) return;

    // Filtriraj vežbe prema grupi mišića
    const filteredExercises = group
        ? Trainer.allExercises.filter(ex => ex.grupa_misica === group)
        : Trainer.allExercises;

    // Prikaz filtriranih vežbi
    container.innerHTML = '';
    if (filteredExercises.length === 0) {
        container.innerHTML = '<p>Nema vežbi za izabranu grupu mišića.</p>';
        return;
    }

    filteredExercises.forEach(exercise => {
        const item = document.createElement('div');
        item.className = 'exercise-list-item';
        item.innerHTML = `
            <div class="exercise-list-info">
                <h4>${exercise.naziv_vezbe}</h4>
                <p>${exercise.opis_vezbe}</p>
                <span>${exercise.grupa_misica}</span>
            </div>
            <div class="exercise-list-actions">
                <i class="fas fa-play" data-video="${exercise.video_link}"></i>
                <i class="fas fa-edit" data-id="${exercise.id}"></i>
                <i class="fas fa-trash" data-id="${exercise.id}"></i>
            </div>
        `;
        container.appendChild(item);
    });

    // Dodaj event listenere za akcije
    document.querySelectorAll('.fa-play').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const videoUrl = e.target.getAttribute('data-video');
            window.open(videoUrl, '_blank');
        });
    });

    document.querySelectorAll('.fa-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const exerciseId = e.target.getAttribute('data-id');
            Trainer.editExercise(exerciseId);
        });
    });

    document.querySelectorAll('.fa-trash').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const exerciseId = e.target.getAttribute('data-id');
            Trainer.deleteExercise(exerciseId);
        });
    });
},
    showClientDetails: function(client) {
        this.currentClient = client;
        App.showScreen('trainer-client-details');
        
        document.getElementById('client-detail-name').textContent = client.Ime_prezime;
        document.getElementById('client-detail-email').textContent = client.email;
        document.getElementById('client-detail-age').textContent = client.Godiste || '-';
        document.getElementById('client-detail-height').textContent = client.Visina ? `${client.Visina} cm` : '-';
        document.getElementById('client-detail-weight').textContent = client.Tezina ? `${client.Tezina} kg` : '-';
        document.getElementById('client-detail-goal').textContent = client.cilj || '-';
        document.getElementById('client-detail-health').textContent = client.zdravsteni_problemi || '-';
        
        const paymentStatus = document.getElementById('client-payment-status');
        paymentStatus.textContent = client.has_paid ? 'Uplata potvrđena' : 'Čeka se uplatu';
        paymentStatus.className = client.has_paid ? 'payment-status' : 'payment-status pending';
        
        const trainingStatus = document.getElementById('client-training-status');
        trainingStatus.textContent = client.has_Training ? 'Trening dostupan' : 'Čeka se trening';
        trainingStatus.className = client.has_Training ? 'training-status' : 'training-status pending';
        
        // Update buttons based on client status
        const confirmPaymentBtn = document.getElementById('confirm-payment');
        const addTrainingBtn = document.getElementById('add-training');
        
        confirmPaymentBtn.textContent = client.has_paid ? 'Opozovi uplatu' : 'Potvrdi uplatu';
        confirmPaymentBtn.style.backgroundColor = client.has_paid ? '#f44336' : '';
        
        addTrainingBtn.textContent = client.has_Training ? 'Uredi trening' : 'Dodaj trening';
        addTrainingBtn.style.backgroundColor = client.has_Training ? '#ff9800' : '';
        
        // Set up event listeners for buttons
        confirmPaymentBtn.onclick = () => this.togglePaymentStatus(client);
        addTrainingBtn.onclick = () => this.showAddTrainingScreen(client);
    },
    
  togglePaymentStatus: function(client) {
    Utils.showLoading('Ažuriranje statusa uplate...');
    
    // Fixed API endpoint - removed "update" from the path
    fetch(`https://x8ki-letl-twmt.n7.xano.io/api:-VqLpohl/user/${client.id}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${App.authToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            has_paid: !client.has_paid
        })
    })
    .then(response => {
        if (!response.ok) {
            console.error('Server response:', response.status, response.statusText);
            throw new Error('Greška pri ažuriranju statusa uplate');
        }
        return response.json();
    })
    .then(updatedClient => {
        Utils.hideLoading();
        // Update the local client object
        Object.assign(client, updatedClient);
        Utils.showAlert(`Status uplate uspešno ažuriran na ${updatedClient.has_paid ? 'potvrđeno' : 'čekanje'}.`, 'success');
        this.showClientDetails(client);
        
        if (updatedClient.has_paid) {
            setTimeout(() => {
                this.setPaymentExpired(updatedClient.id);
            }, 31 * 24 * 60 * 60 * 1000);
        }
    })
    .catch(error => {
        console.error('Greška:', error);
        Utils.hideLoading();
        Utils.showAlert('Greška pri ažuriranju statusa uplate. Pokušajte ponovo.', 'error');
    });
},
    
    setPaymentExpired: function(clientId) {
        fetch(`https://x8ki-letl-twmt.n7.xano.io/api:-VqLpohl/user/${clientId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${App.authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                has_paid: false
            })
        })
        .then(response => {
            if (!response.ok) throw new Error('Greška pri automatskom isticanju uplate');
            return response.json();
        })
        .then(() => {
            console.log(`Uplata za klijenta ${clientId} je automatski istekla nakon 31 dana.`);
        })
        .catch(error => {
            console.error('Greška pri automatskom isticanju uplate:', error);
        });
    },
    
    showAddTrainingScreen: function(client) {
        this.currentClient = client;
        App.showScreen('trainer-add-training');
        document.getElementById('training-client-name').textContent = client.Ime_prezime;
        this.selectedDay = 1;
        this.selectedGroup = '';
        this.selectedExercise = null;
        this.dayExercises = {1:[],2:[],3:[],4:[],5:[]};
        this.populateTrainingDaySelector();
        this.populateMuscleGroupDropdown();
        this.updateSelectedExercisesList();
    },
    
    populateTrainingDaySelector: function() {
        const container = document.getElementById('training-day-selector');
        if (!container) return;
        container.innerHTML = '';
        this.trainingDays.forEach(day => {
            const btn = document.createElement('button');
            btn.textContent = 'Dan ' + day;
            btn.className = 'day-option' + (this.selectedDay === day ? ' active' : '');
            btn.style.marginRight = '8px';
            btn.style.marginBottom = '8px';
            btn.style.padding = '8px 18px';
            btn.style.borderRadius = '6px';
            btn.style.border = 'none';
            btn.style.background = this.selectedDay === day ? '#eb7d00' : '#eee';
            btn.style.color = this.selectedDay === day ? '#fff' : '#333';
            btn.style.fontWeight = 'bold';
            btn.onclick = () => {
                this.selectedDay = day;
                this.selectedGroup = '';
                this.selectedExercise = null;
                this.populateTrainingDaySelector();
                this.populateMuscleGroupDropdown();
                this.updateSelectedExercisesList();
            };
            container.appendChild(btn);
        });
    },
    
    populateMuscleGroupDropdown: function() {
        const groupSelect = document.getElementById('muscle-group-dropdown');
        const exerciseSelect = document.getElementById('exercise-dropdown');
        styleDropdown(groupSelect);
        styleDropdown(exerciseSelect);
        if (!groupSelect || !exerciseSelect) return;
        groupSelect.innerHTML = '<option value="">Izaberi grupu mišića</option>';
        exerciseSelect.innerHTML = '<option value="">Izaberi vežbu</option>';
        fetch('https://x8ki-letl-twmt.n7.xano.io/api:-VqLpohl/exercise', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${App.authToken}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            Trainer.allExercises = data;
            const groups = [...new Set(data.map(ex => ex.grupa_misica))];
            groups.forEach(gr => {
                groupSelect.innerHTML += `<option value="${gr}">${gr}</option>`;
            });
            groupSelect.onchange = function() {
                Trainer.selectedGroup = this.value;
                Trainer.populateExerciseDropdownByGroup();
            };
            exerciseSelect.onchange = function() {
                const ex = (Trainer.allExercises || []).find(e => e.id == this.value);
                Trainer.selectedExercise = ex;
                Trainer.showExerciseDetails(ex);
            };
        });
    },
    populateExerciseDropdownByGroup: function() {
        const exerciseSelect = document.getElementById('exercise-dropdown');
        styleDropdown(exerciseSelect);
        if (!exerciseSelect) return;
        exerciseSelect.innerHTML = '<option value="">Izaberi vežbu</option>';
        if (!Trainer.selectedGroup) return;
        (Trainer.allExercises || []).filter(ex => ex.grupa_misica === Trainer.selectedGroup).forEach(ex => {
            exerciseSelect.innerHTML += `<option value="${ex.id}">${ex.naziv_vezbe}</option>`;
        });
    },
    showExerciseDetails: function(exercise) {
        let details = document.getElementById('exercise-details');
        if (!details) {
            details = document.createElement('div');
            details.id = 'exercise-details';
            details.style.margin = '10px 0 18px 0';
            details.style.padding = '10px';
            details.style.background = '#00000000';
            details.style.borderRadius = '6px';
            details.style.border = '1px solid #eee';
            document.getElementById('exercise-dropdown').parentNode.appendChild(details);
        }
        if (!exercise) {
            details.innerHTML = '';
            return;
        }
        details.innerHTML = `<b>Opis:</b> ${exercise.opis_vezbe || '-'}<br><b>Video:</b> <a href="${exercise.video_link}" target="_blank">Pogledaj video</a>`;
    },
   updateSelectedExercisesList: function() {
    const container = document.querySelector('.selected-list');
    if (!container) return;

    const list = Trainer.dayExercises[Trainer.selectedDay] || [];
    let html = '<table style="width:100%;border-collapse:collapse;margin-bottom:10px;background:#fff8f0;">';
    html += '<tr style="background:#f3e7d9;"><th style="padding:6px;color:#eb8d00;border-bottom:2px solid #eb8d00;">Vežba</th><th style="color:#eb8d00;border-bottom:2px solid #eb8d00;">Grupa</th><th style="color:#eb8d00;border-bottom:2px solid #eb8d00;">Serije</th><th style="color:#eb8d00;border-bottom:2px solid #eb8d00;">Ponavljanja</th><th></th></tr>';

    if (list.length === 0) {
        html += `<tr><td colspan="5" style="text-align:center;color:#eb8d00;padding:12px;">Niste odabrali nijednu vežbu za ovaj dan.</td></tr>`;
    } else {
        list.forEach((exercise, index) => {
            html += `<tr style="border-bottom:1px solid #eb8d00;">
                <td style="padding:6px;color:#eb8d00;">${exercise.naziv_vezbe}</td>
                <td style="color:#eb8d00;">${exercise.grupa_misica}</td>
                <td><input type="number" min="1" value="${exercise.sets}" data-index="${index}" data-type="sets" style="width:50px;background:#fff8f0;color:#eb8d00;border:1px solid #eb8d00;border-radius:4px;text-align:center;"></td>
                <td><input type="number" min="1" value="${exercise.repetitions}" data-index="${index}" data-type="repetitions" style="width:50px;background:#fff8f0;color:#eb8d00;border:1px solid #eb8d00;border-radius:4px;text-align:center;"></td>
                <td><span class="remove-exercise" data-index="${index}" style="color:#eb8d00;cursor:pointer;font-size:1.2em;"><i class="fas fa-times"></i></span></td>
            </tr>`;
        });
    }

    html += '</table>';
    container.innerHTML = html;

    // Dodaj event listenere za promenu serija/ponavljanja i brisanje vežbi
    container.querySelectorAll('input[type=number]').forEach(input => {
        input.addEventListener('change', (e) => {
            const index = parseInt(e.target.getAttribute('data-index'));
            const type = e.target.getAttribute('data-type');
            Trainer.dayExercises[Trainer.selectedDay][index][type] = parseInt(e.target.value);
        });
    });

    container.querySelectorAll('.remove-exercise').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.getAttribute('data-index'));
            Trainer.dayExercises[Trainer.selectedDay].splice(index, 1);
            Trainer.updateSelectedExercisesList();
        });
    });
    },
    saveTraining: function() {
        if (!this.currentClient || !this.currentClient.id) {
            Utils.showAlert('Nije izabran klijent!', 'error');
            return;
        }
        let ukupno = 0;
        for (let d = 1; d <= 5; d++) ukupno += (this.dayExercises[d] || []).length;
        if (ukupno === 0) {
            Utils.showAlert('Morate odabrati barem jednu vežbu.', 'error');
            return;
        }
        const saveBtn = document.getElementById('save-training');
        if (saveBtn) {
            saveBtn.textContent = 'Čuvanje...';
            saveBtn.disabled = true;
            saveBtn.style.background = '#aaa';
        }
        Utils.showLoading('Čuvanje treninga...');
        // Prvo obriši sve vežbe za klijenta za svih 5 dana
        const deletePromises = [1,2,3,4,5].map(day => fetch(`https://x8ki-letl-twmt.n7.xano.io/api:-VqLpohl/training/delete_all?user_id=${this.currentClient.id}&day=${day}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${App.authToken}`,
                'Content-Type': 'application/json'
            }
        }));
        Promise.all(deletePromises)
        .then(() => {
            // Zatim dodaj sve vežbe
            const allEntries = [];
            for (let day = 1; day <= 5; day++) {
                (this.dayExercises[day] || []).forEach(exercise => {
                    allEntries.push({
                        user_id: this.currentClient.id,
                        exercise_id: exercise.exercise_id,
                        day: day,
                        repetitions: exercise.repetitions,
                        sets: exercise.sets
                    });
                });
            }
            const promises = allEntries.map(entry => fetch('https://x8ki-letl-twmt.n7.xano.io/api:-VqLpohl/training', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${App.authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(entry)
            }));
            return Promise.all(promises);
        })
        .then(() => {
            Utils.hideLoading();
            Utils.showAlert('Trening uspešno sačuvan!', 'success');
            App.goBack();
        })
        .catch(error => {
            Utils.hideLoading();
            let msg = 'Došlo je do greške. Molimo pokušajte ponovo.';
            if (error && error.message) msg = error.message;
            Utils.showAlert(msg, 'error');
        })
        .finally(() => {
            if (saveBtn) {
                saveBtn.textContent = 'Sačuvaj trening';
                saveBtn.disabled = false;
                saveBtn.style.background = '#eb7d00';
            }
        });
    },
    loadExercises: function() {
    Utils.showLoading('Učitavanje vežbi...');
    
    fetch(`https://x8ki-letl-twmt.n7.xano.io/api:-VqLpohl/exercise`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${App.authToken}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Greška pri učitavanju vežbi');
        return response.json();
    })
    .then(data => {
        Trainer.allExercises = data;

        // Popuni listu vežbi
        const container = document.querySelector('.exercises-list');
        container.innerHTML = '';

        if (data.length === 0) {
            container.innerHTML = '<p>Nema vežbi u bazi. Dodajte novu vežbu.</p>';
            Utils.hideLoading();
            return;
        }

        data.forEach(exercise => {
            const item = document.createElement('div');
            item.className = 'exercise-list-item';
            item.innerHTML = `
                <div class="exercise-list-info">
                    <h4>${exercise.naziv_vezbe}</h4>
                    <p>${exercise.opis_vezbe}</p>
                    <span>${exercise.grupa_misica}</span>
                </div>
                <div class="exercise-list-actions">
                    <i class="fas fa-play" data-video="${exercise.video_link}"></i>
                    <i class="fas fa-edit" data-id="${exercise.id}"></i>
                    <i class="fas fa-trash" data-id="${exercise.id}"></i>
                </div>
            `;
            container.appendChild(item);
        });

        // Dodaj event listenere za akcije
        document.querySelectorAll('.fa-play').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const videoUrl = e.target.getAttribute('data-video');
                window.open(videoUrl, '_blank');
            });
        });

        document.querySelectorAll('.fa-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const exerciseId = e.target.getAttribute('data-id');
                Trainer.editExercise(exerciseId);
            });
        });

        document.querySelectorAll('.fa-trash').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const exerciseId = e.target.getAttribute('data-id');
                Trainer.deleteExercise(exerciseId);
            });
        });

        // Popuni dropdown za filtriranje grupa mišića
        Trainer.populateExerciseGroupFilter();

        Utils.hideLoading();
    })
    .catch(error => {
        console.error('Greška:', error);
        Utils.hideLoading();
        App.handleApiError(error);
    });
},
    showAddExerciseForm: function() {
        App.showScreen('trainer-add-exercise');
        document.getElementById('exercise-form').reset();
    },
    saveExercise: function() {
        const formData = {
            naziv_vezbe: document.getElementById('exercise-name').value,
            grupa_misica: document.getElementById('exercise-group').value,
            opis_vezbe: document.getElementById('exercise-description').value,
            video_link: document.getElementById('exercise-video').value
        };
        
        if (!formData.naziv_vezbe || !formData.grupa_misica || !formData.video_link) {
            Utils.showAlert('Molimo popunite sva obavezna polja.', 'error');
            return;
        }
        
        Utils.showLoading('Čuvanje vežbe...');
        
        fetch('https://x8ki-letl-twmt.n7.xano.io/api:-VqLpohl/exercise', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${App.authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) throw new Error('Greška pri čuvanju vežbe');
            return response.json();
        })
        .then(() => {
            Utils.hideLoading();
            Utils.showAlert('Vežba uspešno sačuvana!', 'success');
            App.goBack();
            this.loadExercises();
        })
        .catch(error => {
            console.error('Greška:', error);
            Utils.hideLoading();
            App.handleApiError(error);
        });
    },
    editExercise: function(exerciseId) {
        // Implementation for editing an exercise
        Utils.showAlert('Funkcionalnost za izmenu vežbe će biti dodata u narednoj verziji.', 'info');
    },
    deleteExercise: function(exerciseId) {
        if (!confirm('Da li ste sigurni da želite da obrišete ovu vežbu?')) return;
        
        Utils.showLoading('Brisanje vežbe...');
        
        fetch(`https://x8ki-letl-twmt.n7.xano.io/api:-VqLpohl/exercise/${exerciseId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${App.authToken}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) throw new Error('Greška pri brisanju vežbe');
            return response.json();
        })
        .then(() => {
            Utils.hideLoading();
            Utils.showAlert('Vežba uspešno obrisana!', 'success');
            this.loadExercises();
        })
        .catch(error => {
            console.error('Greška:', error);
            Utils.hideLoading();
            App.handleApiError(error);
        });
    },
    loadStats: function() {
        Utils.showLoading('Učitavanje statistike...');
        
        // Get all clients
        fetch(`https://x8ki-letl-twmt.n7.xano.io/api:-VqLpohl/user?role=client`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${App.authToken}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) throw new Error('Greška pri učitavanju klijenata');
            return response.json();
        })
        .then(clients => {
            const totalClients = clients.length;
            const activeClients = clients.filter(c => c.has_paid && c.has_Training).length;
            const pendingPayments = clients.filter(c => !c.has_paid).length;
            const pendingTrainings = clients.filter(c => c.has_paid && !c.has_Training).length;
            
            // Update stats cards
            document.getElementById('total-clients').textContent = totalClients;
            document.getElementById('active-clients').textContent = activeClients;
            document.getElementById('pending-payments').textContent = pendingPayments;
            document.getElementById('pending-trainings').textContent = pendingTrainings;
            
            // Prepare data for chart
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Avg', 'Sep', 'Okt', 'Nov', 'Dec'];
            const currentMonth = new Date().getMonth();
            const monthLabels = [];
            const monthCounts = [];
            
            for (let i = 0; i < 6; i++) {
                const monthIndex = (currentMonth - 5 + i + 12) % 12;
                monthLabels.push(months[monthIndex]);
                
                // For demo purposes, we'll use random numbers
                // In a real app, you would filter clients by registration month
                monthCounts.push(Math.floor(Math.random() * 10) + 1);
            }
            
            // Create or update chart
            const ctx = document.getElementById('clients-chart').getContext('2d');
            
            if (window.clientsChart) {
                window.clientsChart.data.labels = monthLabels;
                window.clientsChart.data.datasets[0].data = monthCounts;
                window.clientsChart.update();
            } else {
                window.clientsChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: monthLabels,
                        datasets: [{
                            label: 'Novi klijenti po mesecu',
                            data: monthCounts,
                            backgroundColor: 'rgba(235, 125, 0, 0.7)',
                            borderColor: 'rgba(235, 125, 0, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    stepSize: 1
                                }
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
        const user = App.currentUser;
        
        document.getElementById('trainer-profile-name').textContent = user.Ime_prezime || '-';
        document.getElementById('trainer-profile-email').textContent = user.email || '-';
    }
};

// Set up event listeners for trainer-specific forms
document.addEventListener('DOMContentLoaded', function() {
    // Exercise search
    document.getElementById('search-exercise')?.addEventListener('click', function() {
        Trainer.searchExercises();
    });
    
    // Exercise form submission
    document.getElementById('exercise-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        Trainer.saveExercise();
    });
    
    // Save training
    document.getElementById('save-training')?.addEventListener('click', function() {
        Trainer.saveTraining();
    });
    
    // Add exercise button
    document.getElementById('add-exercise')?.addEventListener('click', function() {
        Trainer.showAddExerciseForm();
    });
    
    // Popuni dropdown za vežbe kada se otvori ekran za dodavanje treninga
    if (document.getElementById('trainer-add-training')) {
        document.getElementById('trainer-add-training').addEventListener('show', function() {
            Trainer.populateExerciseDropdown();
        });
    }
    // Ručno pozovi popunjavanje dropdowna kad god se otvori ekran
    window.addEventListener('hashchange', function() {
        if (document.getElementById('trainer-add-training')?.classList.contains('active')) {
            Trainer.populateExerciseDropdown();
        }
    });
    // Dodavanje vežbe za izabrani dan
    if (document.getElementById('add-exercise-to-list')) {
        document.getElementById('add-exercise-to-list').onclick = function() {
            const sets = parseInt(document.getElementById('sets-input').value) || 3;
            const reps = parseInt(document.getElementById('reps-input').value) || 12;
            const ex = Trainer.selectedExercise;
            if (!ex) {
                Utils.showAlert('Izaberite vežbu!', 'error');
                return;
            }
            if (sets <= 0 || reps <= 0) {
                Utils.showAlert('Serije i ponavljanja moraju biti veći od 0!', 'error');
                return;
            }
            if (Trainer.dayExercises[Trainer.selectedDay].some(e => e.exercise_id == ex.id)) {
                Utils.showAlert('Vežba je već dodata za ovaj dan!', 'warning');
                return;
            }
            Trainer.dayExercises[Trainer.selectedDay].push({
                exercise_id: ex.id,
                naziv_vezbe: ex.naziv_vezbe,
                grupa_misica: ex.grupa_misica,
                video_link: ex.video_link,
                sets,
                repetitions: reps
            });
            Trainer.updateSelectedExercisesList();
            Utils.showAlert('Vežba uspešno dodata!', 'success');
        };
    }
});

// Prikaz opisa i video linka izabrane vežbe
function showExerciseDetails(exercise) {
    let details = document.getElementById('exercise-details');
    if (!details) {
        details = document.createElement('div');
        details.id = 'exercise-details';
        details.style.margin = '10px 0 18px 0';
        details.style.padding = '10px';
        details.style.background = '#f8f8f8';
        details.style.borderRadius = '6px';
        details.style.border = '1px solid #eee';
        document.getElementById('exercise-dropdown').parentNode.appendChild(details);
    }
    if (!exercise) {
        details.innerHTML = '';
        return;
    }
    details.innerHTML = `<b>Opis:</b> ${exercise.opis_vezbe || '-'}<br><b>Video:</b> <a href="${exercise.video_link}" target="_blank">Pogledaj video</a>`;
}

Trainer.populateExerciseDropdown = function() {
    const select = document.getElementById('exercise-dropdown');
    if (!select) return;
    select.innerHTML = '<option value="">Učitavanje vežbi...</option>';
    fetch('https://x8ki-letl-twmt.n7.xano.io/api:-VqLpohl/exercise', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${App.authToken}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        Trainer.allExercises = data;
        select.innerHTML = '<option value="">Izaberi vežbu</option>';
        data.forEach(ex => {
            select.innerHTML += `<option value="${ex.id}">${ex.naziv_vezbe} (${ex.grupa_misica})</option>`;
        });
        showExerciseDetails();
    })
    .catch(() => {
        select.innerHTML = '<option value="">Greška pri učitavanju</option>';
    });
    select.onchange = function() {
        const ex = (Trainer.allExercises || []).find(e => e.id == select.value);
        showExerciseDetails(ex);
    };
};

// --- UI stilizacija za dropdownove ---
function styleDropdown(el) {
    if (!el) return;
    el.classList.add('styled-dropdown');
    el.style.width = '100%';
    el.style.padding = '10px';
    el.style.borderRadius = '8px';
    el.style.border = '1.5px solid #eb8d00';
    el.style.fontSize = '1.1em';
    el.style.marginBottom = '10px';
    el.style.background = '#fff8f0';
    el.style.color = '#eb8d00';
    el.style.fontWeight = 'bold';
}