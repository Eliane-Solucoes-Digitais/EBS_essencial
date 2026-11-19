
/* =====================================
   EBS BEAUTY ESSENCIAL
   Gestão de agenda, clientes e serviços
===================================== */

/* =====================================
   ARMAZENAMENTO LOCAL
===================================== */

const Store = {
    get(key) {
        try {
            return JSON.parse(localStorage.getItem(key)) || [];
        } catch {
            return [];
        }
    },

    set(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }
};

const KEYS = {
    appointments: "ebs_essencial_agendamentos",
    clients: "ebs_essencial_clientes",
    services: "ebs_essencial_servicos",
    professionals: "ebs_essencial_profissionais"
};

let appointments = Store.get(KEYS.appointments);
let clients = Store.get(KEYS.clients);
let services = Store.get(KEYS.services);
let professionals = Store.get(KEYS.professionals);

let editingClientId = null;
let editingServiceId = null;
let editingProfessionalId = null;

let agendaView = "month";
let agendaDate = getToday();

/* =====================================
   FUNÇÕES GERAIS
===================================== */

const $ = id => document.getElementById(id);

function getToday() {
    const date = new Date();

    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-");
}

function parseDate(value) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day, 12);
}

function formatDate(value) {
    return parseDate(value).toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });
}

function createId() {
    return crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function money(value) {
    return Number(value || 0).toLocaleString("pt-PT", {
        style: "currency",
        currency: "EUR"
    });
}

function saveAll() {
    Store.set(KEYS.appointments, appointments);
    Store.set(KEYS.clients, clients);
    Store.set(KEYS.services, services);
    Store.set(KEYS.professionals, professionals);
}

/* =====================================
   NAVEGAÇÃO
===================================== */

function showPage(pageId) {
    document.querySelectorAll(".page").forEach(page => {
        page.classList.toggle("active", page.id === pageId);
    });

    document.querySelectorAll(".menu-item").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === pageId
        );
    });

    if (pageId === "dashboard") renderDashboard();
    if (pageId === "agenda") renderAppointments();
    if (pageId === "clientes") renderClients();
    if (pageId === "servicos") renderServices();
    if (pageId === "profissionais") renderProfessionals();
}

document.querySelectorAll(".menu-item").forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.page);
    });
});

/* =====================================
   DASHBOARD
===================================== */

function renderDashboard() {
    $("totalAppointments").textContent = appointments.length;
    $("totalClients").textContent = clients.length;
    $("totalServices").textContent = services.length;
    $("totalProfessionals").textContent = professionals.length;

    const today = getToday();

    const upcoming = appointments
        .filter(item => item.date >= today && item.status !== "Cancelado")
        .sort((a, b) =>
            (a.date + a.time).localeCompare(b.date + b.time)
        )
        .slice(0, 5);

    $("dashboardAppointments").innerHTML = upcoming.length
        ? upcoming.map(item => `
            <div class="appointment-row">
                <div>
                    <strong>${escapeHTML(item.clientName)}</strong>
                    <small>${escapeHTML(item.serviceName)} · ${escapeHTML(item.professionalName)}</small>
                </div>
                <span>${escapeHTML(item.date)} · ${escapeHTML(item.time)}</span>
            </div>
        `).join("")
        : '<div class="empty-state">Ainda não existem próximos agendamentos.</div>';
}

/* =====================================
   CLIENTES
===================================== */

$("clientForm").addEventListener("submit", event => {
    event.preventDefault();

    const name = $("clientName").value.trim();
    const phone = $("clientPhone").value.trim();
    const email = $("clientEmail").value.trim();

    if (!name) return;

    if (editingClientId) {
        clients = clients.map(client =>
            client.id === editingClientId
                ? { ...client, name, phone, email }
                : client
        );

        editingClientId = null;
    } else {
        clients.push({
            id: createId(),
            name,
            phone,
            email
        });
    }

    saveAll();

    $("clientForm").reset();
    $("clientForm").querySelector('[type="submit"]').textContent =
        "Adicionar cliente";

    renderClients();
    updateSelects();
    renderDashboard();
});

function renderClients() {
    $("clientsList").innerHTML = clients.length
        ? clients.map(client => `
            <div class="data-row">
                <div>
                    <strong>${escapeHTML(client.name)}</strong>
                    <small>${escapeHTML(client.phone || "Sem telefone")} · ${escapeHTML(client.email || "Sem e-mail")}</small>
                </div>

                <div class="appointment-actions">
                    <button class="secondary-button" data-edit-client="${client.id}">
                        Editar
                    </button>

                    <button class="delete-button" data-delete-client="${client.id}">
                        Excluir
                    </button>
                </div>
            </div>
        `).join("")
        : '<div class="empty-state">Ainda não existem clientes.</div>';
}

$("clientsList").addEventListener("click", event => {
    const editButton = event.target.closest("[data-edit-client]");
    const deleteButton = event.target.closest("[data-delete-client]");

    if (editButton) {
        const client = clients.find(
            item => item.id === editButton.dataset.editClient
        );

        if (!client) return;

        editingClientId = client.id;

        $("clientName").value = client.name;
        $("clientPhone").value = client.phone || "";
        $("clientEmail").value = client.email || "";

        $("clientForm").querySelector('[type="submit"]').textContent =
            "Guardar alterações";

        $("clientName").focus();
    }

    if (deleteButton) {
        const id = deleteButton.dataset.deleteClient;

        if (!confirm("Tens a certeza de que desejas excluir este cliente?")) {
            return;
        }

        clients = clients.filter(client => client.id !== id);

        if (editingClientId === id) {
            editingClientId = null;
            $("clientForm").reset();
            $("clientForm").querySelector('[type="submit"]').textContent =
                "Adicionar cliente";
        }

        saveAll();
        renderClients();
        updateSelects();
        renderDashboard();
    }
});

/* =====================================
   SERVIÇOS
===================================== */

$("serviceForm").addEventListener("submit", event => {
    event.preventDefault();

    const name = $("serviceName").value.trim();
    const duration = Number($("serviceDuration").value);
    const price = Number($("servicePrice").value);

    if (!name) return;

    if (editingServiceId) {
        services = services.map(service =>
            service.id === editingServiceId
                ? { ...service, name, duration, price }
                : service
        );

        editingServiceId = null;
    } else {
        services.push({
            id: createId(),
            name,
            duration,
            price
        });
    }

    saveAll();

    $("serviceForm").reset();
    $("serviceForm").querySelector('[type="submit"]').textContent =
        "Adicionar serviço";

    renderServices();
    updateSelects();
    renderDashboard();
});

function renderServices() {
    $("servicesList").innerHTML = services.length
        ? services.map(service => `
            <div class="data-row">
                <div>
                    <strong>${escapeHTML(service.name)}</strong>
                    <small>${service.duration} minutos · ${money(service.price)}</small>
                </div>

                <div class="appointment-actions">
                    <button class="secondary-button" data-edit-service="${service.id}">
                        Editar
                    </button>

                    <button class="delete-button" data-delete-service="${service.id}">
                        Excluir
                    </button>
                </div>
            </div>
        `).join("")
        : '<div class="empty-state">Ainda não existem serviços.</div>';
}

$("servicesList").addEventListener("click", event => {
    const editButton = event.target.closest("[data-edit-service]");
    const deleteButton = event.target.closest("[data-delete-service]");

    if (editButton) {
        const service = services.find(
            item => item.id === editButton.dataset.editService
        );

        if (!service) return;

        editingServiceId = service.id;

        $("serviceName").value = service.name;
        $("serviceDuration").value = service.duration;
        $("servicePrice").value = service.price;

        $("serviceForm").querySelector('[type="submit"]').textContent =
            "Guardar alterações";
    }

    if (deleteButton) {
        const id = deleteButton.dataset.deleteService;

        if (!confirm("Tens a certeza de que desejas excluir este serviço?")) {
            return;
        }

        services = services.filter(service => service.id !== id);

        if (editingServiceId === id) {
            editingServiceId = null;
            $("serviceForm").reset();
            $("serviceForm").querySelector('[type="submit"]').textContent =
                "Adicionar serviço";
        }

        saveAll();
        renderServices();
        updateSelects();
        renderDashboard();
    }
});

/* =====================================
   PROFISSIONAIS
===================================== */

$("professionalForm").addEventListener("submit", event => {
    event.preventDefault();

    const name = $("professionalName").value.trim();
    const start = $("professionalStart").value;
    const end = $("professionalEnd").value;

    if (!name) return;

    if (start >= end) {
        alert("A hora de fim deve ser posterior à hora de início.");
        return;
    }

    if (editingProfessionalId) {
        professionals = professionals.map(professional =>
            professional.id === editingProfessionalId
                ? { ...professional, name, start, end }
                : professional
        );

        editingProfessionalId = null;
    } else {
        professionals.push({
            id: createId(),
            name,
            start,
            end
        });
    }

    saveAll();

    $("professionalForm").reset();
    $("professionalForm").querySelector('[type="submit"]').textContent =
        "Adicionar profissional";

    renderProfessionals();
    updateSelects();
    renderDashboard();
});

function renderProfessionals() {
    $("professionalsList").innerHTML = professionals.length
        ? professionals.map(professional => `
            <div class="data-row">
                <div>
                    <strong>${escapeHTML(professional.name)}</strong>
                    <small>Horário: ${professional.start} às ${professional.end}</small>
                </div>

                <div class="appointment-actions">
                    <button class="secondary-button" data-edit-professional="${professional.id}">
                        Editar
                    </button>

                    <button class="delete-button" data-delete-professional="${professional.id}">
                        Excluir
                    </button>
                </div>
            </div>
        `).join("")
        : '<div class="empty-state">Ainda não existem profissionais.</div>';
}

$("professionalsList").addEventListener("click", event => {
    const editButton = event.target.closest("[data-edit-professional]");
    const deleteButton = event.target.closest("[data-delete-professional]");

    if (editButton) {
        const professional = professionals.find(
            item => item.id === editButton.dataset.editProfessional
        );

        if (!professional) return;

        editingProfessionalId = professional.id;

        $("professionalName").value = professional.name;
        $("professionalStart").value = professional.start;
        $("professionalEnd").value = professional.end;

        $("professionalForm").querySelector('[type="submit"]').textContent =
            "Guardar alterações";
    }

    if (deleteButton) {
        const id = deleteButton.dataset.deleteProfessional;

        if (!confirm("Tens a certeza de que desejas excluir esta profissional?")) {
            return;
        }

        professionals = professionals.filter(
            professional => professional.id !== id
        );

        if (editingProfessionalId === id) {
            editingProfessionalId = null;
            $("professionalForm").reset();
            $("professionalForm").querySelector('[type="submit"]').textContent =
                "Adicionar profissional";
        }

        saveAll();
        renderProfessionals();
        updateSelects();
        renderDashboard();
    }
});

/* =====================================
   LISTAS DE SELEÇÃO
===================================== */

function updateSelects() {
    $("appointmentClient").innerHTML =
        '<option value="">Selecionar cliente</option>' +
        clients.map(client =>
            `<option value="${client.id}">${escapeHTML(client.name)}</option>`
        ).join("");

    $("appointmentProfessional").innerHTML =
        '<option value="">Selecionar profissional</option>' +
        professionals.map(professional =>
            `<option value="${professional.id}">${escapeHTML(professional.name)}</option>`
        ).join("");

    $("appointmentService").innerHTML =
        '<option value="">Selecionar serviço</option>' +
        services.map(service =>
            `<option value="${service.id}">${escapeHTML(service.name)}</option>`
        ).join("");

    const filter = $("agendaProfessionalFilter");
    const selected = filter.value;

    filter.innerHTML =
        '<option value="">Todas as profissionais</option>' +
        professionals.map(professional =>
            `<option value="${professional.id}">${escapeHTML(professional.name)}</option>`
        ).join("");

    if (professionals.some(item => item.id === selected)) {
        filter.value = selected;
    }
}

$("appointmentService").addEventListener("change", () => {
    const service = services.find(
        item => item.id === $("appointmentService").value
    );

    if (!service) return;

    $("appointmentDuration").value = service.duration;
    $("appointmentValue").value = service.price;
});

/* =====================================
   AGENDA — NAVEGAÇÃO
===================================== */

function setAgendaDate(value) {
    agendaDate = value;
    $("filterDate").value = value;

    renderAppointments();
}

function changeAgendaDate(amount) {
    const date = parseDate(agendaDate);

    if (agendaView === "month") {
        date.setMonth(date.getMonth() + amount, 1);
    } else {
        date.setDate(date.getDate() + amount);
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    setAgendaDate(`${year}-${month}-${day}`);
}

$("prevDateBtn").addEventListener("click", () => {
    changeAgendaDate(-1);
});

$("nextDateBtn").addEventListener("click", () => {
    changeAgendaDate(1);
});

$("todayBtn").addEventListener("click", () => {
    setAgendaDate(getToday());
});

$("filterDate").addEventListener("change", () => {
    if (!$("filterDate").value) return;

    agendaDate = $("filterDate").value;
    renderAppointments();
});

$("agendaProfessionalFilter").addEventListener("change", () => {
    renderAppointments();
});

/* =====================================
   AGENDA — VISTA MÊS / DIA
===================================== */

document.querySelectorAll(".agenda-view").forEach(button => {
    button.addEventListener("click", () => {
        agendaView = button.dataset.view;

        document.querySelectorAll(".agenda-view").forEach(item => {
            item.classList.toggle("active", item === button);
        });

        renderAppointments();
    });
});

/* =====================================
   AGENDA — CALENDÁRIO MENSAL
===================================== */

function renderCalendar() {
    const date = parseDate(agendaDate);
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const offset = (firstDay + 6) % 7;

    const weekdays = [
        "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"
    ];

    let html = `
        <div class="calendar-grid">
            ${weekdays.map(day => `
                <div class="calendar-weekday">${day}</div>
            `).join("")}
    `;

    for (let i = 0; i < offset; i++) {
        html += '<div class="calendar-empty"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const value = [
            year,
            String(month + 1).padStart(2, "0"),
            String(day).padStart(2, "0")
        ].join("-");

        const hasAppointments = appointments.some(item => {
            const professionalFilter = $("agendaProfessionalFilter").value;

            return item.date === value &&
                (!professionalFilter || item.professionalId === professionalFilter);
        });

        const isSelected = value === agendaDate;
        const isToday = value === getToday();

        html += `
            <button
                type="button"
                class="calendar-day
                    ${isSelected ? "selected" : ""}
                    ${isToday ? "today" : ""}
                    ${hasAppointments ? "has-appointments" : ""}"
                data-calendar-date="${value}">
                <span>${day}</span>
                ${hasAppointments ? '<i></i>' : ""}
            </button>
        `;
    }

    html += "</div>";

    $("agendaCalendar").innerHTML = html;
}

$("agendaCalendar").addEventListener("click", event => {
    const button = event.target.closest("[data-calendar-date]");

    if (!button) return;

    setAgendaDate(button.dataset.calendarDate);
});

/* =====================================
   AGENDA — RENDERIZAÇÃO
===================================== */

function renderAppointments() {
    const selectedDate = agendaDate;
    const selectedProfessional = $("agendaProfessionalFilter").value;

    const date = parseDate(selectedDate);

    if (agendaView === "month") {
        $("agendaCurrentLabel").textContent =
            date.toLocaleDateString("pt-PT", {
                month: "long",
                year: "numeric"
            });

        $("agendaCalendar").hidden = false;
        renderCalendar();
    } else {
        $("agendaCurrentLabel").textContent = formatDate(selectedDate);
        $("agendaCalendar").hidden = true;
    }

    const filtered = appointments
        .filter(item => item.date === selectedDate)
        .filter(item =>
            !selectedProfessional ||
            item.professionalId === selectedProfessional
        )
        .sort((a, b) => a.time.localeCompare(b.time));

    $("appointmentsList").innerHTML = filtered.length
        ? filtered.map(item => `
            <div class="appointment-card">
                <div class="appointment-info">
                    <strong>${escapeHTML(item.time)} — ${escapeHTML(item.clientName)}</strong>
                    <span>${escapeHTML(item.serviceName)} · ${escapeHTML(item.professionalName)}</span>
                    <small>${escapeHTML(item.date)} · ${escapeHTML(item.status)}</small>
                    <small>${money(item.value)}</small>
                    ${item.notes ? `<small>${escapeHTML(item.notes)}</small>` : ""}
                </div>

                <div class="appointment-actions">
                    <button class="secondary-button" data-edit-appointment="${item.id}">
                        Editar
                    </button>

                    <button class="whatsapp-button" data-whatsapp="${item.id}">
                        WhatsApp
                    </button>

                    <button class="delete-button" data-delete-appointment="${item.id}">
                        Eliminar
                    </button>
                </div>
            </div>
        `).join("")
        : '<div class="empty-state">Não existem agendamentos para esta data.</div>';
}

/* =====================================
   NOVO AGENDAMENTO
===================================== */

$("newAppointmentBtn").addEventListener("click", () => {
    $("appointmentForm").reset();
    $("appointmentId").value = "";
    $("appointmentFormTitle").textContent = "Novo agendamento";
    $("appointmentFormPanel").hidden = false;

    $("appointmentDate").value = agendaDate;

    updateSelects();

    $("appointmentFormPanel").scrollIntoView({
        behavior: "smooth"
    });
});

$("cancelAppointmentBtn").addEventListener("click", () => {
    $("appointmentFormPanel").hidden = true;
});

/* =====================================
   EDITAR / ELIMINAR AGENDAMENTO
===================================== */

$("appointmentsList").addEventListener("click", event => {
    const editButton = event.target.closest("[data-edit-appointment]");
    const deleteButton = event.target.closest("[data-delete-appointment]");
    const whatsappButton = event.target.closest("[data-whatsapp]");

    if (editButton) {
        editAppointment(editButton.dataset.editAppointment);
    }

    if (deleteButton) {
        if (!confirm("Eliminar este agendamento?")) return;

        appointments = appointments.filter(
            item => item.id !== deleteButton.dataset.deleteAppointment
        );

        saveAll();
        renderAppointments();
        renderDashboard();
    }

    if (whatsappButton) {
        sendWhatsApp(whatsappButton.dataset.whatsapp);
    }
});

function editAppointment(id) {
    const item = appointments.find(appointment => appointment.id === id);

    if (!item) return;

    updateSelects();

    $("appointmentId").value = item.id;
    $("appointmentClient").value = item.clientId;
    $("appointmentProfessional").value = item.professionalId;
    $("appointmentService").value = item.serviceId;
    $("appointmentDate").value = item.date;
    $("appointmentTime").value = item.time;
    $("appointmentDuration").value = item.duration;
    $("appointmentValue").value = item.value;
    $("appointmentStatus").value = item.status;
    $("appointmentNotes").value = item.notes || "";

    $("appointmentFormTitle").textContent = "Editar agendamento";
    $("appointmentFormPanel").hidden = false;

    $("appointmentFormPanel").scrollIntoView({
        behavior: "smooth"
    });
}

/* =====================================
   GUARDAR AGENDAMENTO
===================================== */

function timeToMinutes(time) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}

$("appointmentForm").addEventListener("submit", event => {
    event.preventDefault();

    const id = $("appointmentId").value;

    const client = clients.find(
        item => item.id === $("appointmentClient").value
    );

    const professional = professionals.find(
        item => item.id === $("appointmentProfessional").value
    );

    const service = services.find(
        item => item.id === $("appointmentService").value
    );

    if (!client || !professional || !service) {
        alert("Seleciona um cliente, uma profissional e um serviço.");
        return;
    }

    const date = $("appointmentDate").value;
    const time = $("appointmentTime").value;
    const duration = Number($("appointmentDuration").value);

    if (!date || !time || duration <= 0) {
        alert("Confirma a data, hora e duração.");
        return;
    }

    const start = timeToMinutes(time);
    const end = start + duration;

    if (time < professional.start || end > timeToMinutes(professional.end)) {
        alert("O horário está fora do horário de trabalho da profissional.");
        return;
    }

    const conflict = appointments.some(item => {
        if (
            item.id === id ||
            item.professionalId !== professional.id ||
            item.date !== date ||
            item.status === "Cancelado"
        ) {
            return false;
        }

        const otherStart = timeToMinutes(item.time);
        const otherEnd = otherStart + Number(item.duration);

        return start < otherEnd && end > otherStart;
    });

    if (conflict) {
        alert("Esta profissional já tem um agendamento nesse horário.");
        return;
    }

    const appointment = {
        id: id || createId(),
        clientId: client.id,
        clientName: client.name,
        clientPhone: client.phone,
        professionalId: professional.id,
        professionalName: professional.name,
        serviceId: service.id,
        serviceName: service.name,
        date,
        time,
        duration,
        value: Number($("appointmentValue").value || 0),
        status: $("appointmentStatus").value,
        notes: $("appointmentNotes").value.trim()
    };

    if (id) {
        appointments = appointments.map(item =>
            item.id === id ? appointment : item
        );
    } else {
        appointments.push(appointment);
    }

    saveAll();

    agendaDate = date;
    $("filterDate").value = date;

    $("appointmentFormPanel").hidden = true;

    renderAppointments();
    renderDashboard();

    alert("Agendamento guardado com sucesso!");
});

/* =====================================
   WHATSAPP
===================================== */

function sendWhatsApp(id) {
    const appointment = appointments.find(item => item.id === id);

    if (!appointment) return;

    const phone = String(appointment.clientPhone || "").replace(/\D/g, "");

    if (!phone) {
        alert("Este cliente não tem telefone registado.");
        return;
    }

    const message =
        `Olá, ${appointment.clientName}! 😊\n\n` +
        `Gostaríamos de confirmar o seu agendamento:\n` +
        `Serviço: ${appointment.serviceName}\n` +
        `Data: ${appointment.date}\n` +
        `Hora: ${appointment.time}\n` +
        `Profissional: ${appointment.professionalName}\n\n` +
        `Aguardamos a sua confirmação. Obrigada!`;

    const url =
        `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank", "noopener,noreferrer");
}

/* =====================================
   INICIALIZAÇÃO
===================================== */

function initializeApp() {
    updateSelects();

    $("filterDate").value = agendaDate;

    renderDashboard();
    renderAppointments();
    renderClients();
    renderServices();
    renderProfessionals();
}

initializeApp();
