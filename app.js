/* =========================================================
   EBS BEAUTY ESSENCIAL
   MODO DE DEMONSTRAÇÃO — VERSÃO DE DESENVOLVIMENTO

   Os dados são guardados localmente no navegador.
   Não são enviados para o Firebase nesta versão.
========================================================= */

/* =========================================
   0. LIGAÇÃO AO FIREBASE
========================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyBg5gMODOjb0uTlBXu_sZ-V2X-xLLQfo3s",
  authDomain: "ebs-beauty-essencial-dev.firebaseapp.com",
  projectId: "ebs-beauty-essencial-dev",
  storageBucket: "ebs-beauty-essencial-dev.firebasestorage.app",
  messagingSenderId: "247538792217",
  appId: "1:247538792217:web:83549932a0c517d6087788"
};


const firebaseApp = initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);

const db = getFirestore(firebaseApp);

/* =========================================
   1. CONFIGURAÇÃO
========================================= */

const DEMO_STORAGE_KEY = "ebs_beauty_essencial_demo_v1";

const state = {
  user: null,
  salonId: null,
  salon: {
    name: "EBS Beauty Essencial"
  },
  appointments: [],
  clients: [],
  services: [],
  professionals: [],
  currentDate: new Date(),
  currentView: "day",
  activePage: "agenda",
  bufferMinutes: 0
};

const $ = (id) => document.getElementById(id);

const loadingScreen = $("loadingScreen");
const loginScreen = $("loginScreen");
const appScreen = $("app");
const loginForm = $("loginForm");

/* =========================================
   2. ECRÃS
========================================= */

function hideLoading() {
  loadingScreen?.setAttribute("hidden", "");
  loadingScreen?.classList.add("hidden");
}

function showApp() {
  loginScreen?.setAttribute("hidden", "");
  loginScreen?.classList.add("hidden");

  appScreen?.removeAttribute("hidden");
  appScreen?.classList.remove("hidden");

  hideLoading();
}

/* =========================================
   3. NOTIFICAÇÕES
========================================= */

function notify(message, type = "success") {
  document.querySelectorAll(".toast").forEach((item) => item.remove());

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3500);
}

function showError(error, fallback = "Ocorreu um erro.") {
  console.error(error);
  notify(error?.message || fallback, "error");
}

/* =========================================
   4. DATAS E HORAS
========================================= */

function dateKey(date) {
  const d = new Date(date);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("pt-PT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(date);
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit"
  }).format(date);
}
function formatTopbarDate(date) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date).replace(".", "");
}
function timeToMinutes(time) {
  const [hours, minutes] = (time || "00:00").split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function addDays(date, amount) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function createId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/* =========================================
   5. ARMAZENAMENTO LOCAL
========================================= */

function saveData() {
  const data = {
    salon: state.salon,
    bufferMinutes: state.bufferMinutes,
    appointments: state.appointments,
    clients: state.clients,
    services: state.services,
    professionals: state.professionals
  };

  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    showError(error, "Não foi possível guardar os dados neste navegador.");
  }
}

function loadData() {
  try {
    const saved = localStorage.getItem(DEMO_STORAGE_KEY);

    if (saved) {
      const data = JSON.parse(saved);

      state.salon = data.salon || { name: "EBS Beauty Essencial" };
      state.bufferMinutes = Number(data.bufferMinutes || 0);
      state.appointments = data.appointments || [];
      state.clients = data.clients || [];
      state.services = data.services || [];
      state.professionals = data.professionals || [];

      return;
    }
  } catch (error) {
    console.error("Erro ao carregar os dados locais:", error);
  }

  createDemoData();
  saveData();
}

function createDemoData() {
  const client1 = createId();
  const client2 = createId();

  const service1 = createId();
  const service2 = createId();

  const professional1 = createId();
  const professional2 = createId();

  state.clients = [
    {
      id: client1,
      name: "Maria Silva",
      phone: "",
      email: ""
    },
    {
      id: client2,
      name: "Joana Costa",
      phone: "",
      email: ""
    }
  ];

  state.services = [
    {
      id: service1,
      name: "Manicure",
      duration: 45,
      price: 20
    },
    {
      id: service2,
      name: "Pedicure",
      duration: 60,
      price: 25
    }
  ];

  state.professionals = [
    {
      id: professional1,
      name: "Ana",
      start: "08:00",
      end: "17:00",
      active: true
    },
    {
      id: professional2,
      name: "Sofia",
      start: "09:00",
      end: "18:00",
      active: true
    }
  ];

  state.appointments = [];
}

/* =========================================
   6. MODO DE DEMONSTRAÇÃO
========================================= */

function enterDemoMode() {
  loadData();

  state.user = null;
  state.salonId = null;

  showApp();

  applySalonSettings();
  setupNavigation();
  setupAgenda();
  setupForms();
  setupMobileMenu();
  setupDialogButtons();

  renderAll();

  notify("Modo de demonstração ativo.");
}

if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    notify("O acesso com login será ativado numa fase posterior.");
  });
}

/* =========================================
   7. CONFIGURAÇÕES DO SALÃO
========================================= */

function applySalonSettings() {
  const name = state.salon.name || "EBS Beauty Essencial";

  if ($("salonName")) {
    $("salonName").textContent = name;
  }

  if ($("settingSalonName")) {
    $("settingSalonName").value = name;
  }

  if ($("bufferMinutes")) {
    $("bufferMinutes").value = state.bufferMinutes;
  }
}

$("saveSettingsBtn")?.addEventListener("click", () => {
  const name = $("settingSalonName")?.value.trim();
  const buffer = Number($("bufferMinutes")?.value || 0);

  if (!name) {
    notify("Indique o nome do salão.", "error");
    return;
  }

  if (buffer < 0 || buffer > 120) {
    notify("O intervalo deve estar entre 0 e 120 minutos.", "error");
    return;
  }

  state.salon.name = name;
  state.bufferMinutes = buffer;

  saveData();
  applySalonSettings();

  notify("Configurações guardadas.");
});

/* =========================================
   8. NAVEGAÇÃO
========================================= */

function setupNavigation() {
  document.querySelectorAll("[data-page]").forEach((button) => {
    button.addEventListener("click", () => {
      openPage(button.dataset.page);
    });
  });
}

function openPage(page) {
  state.activePage = page;

  document.querySelectorAll(".page").forEach((element) => {
    element.classList.remove("active");
  });

  $(`page-${page}`)?.classList.add("active");

  document.querySelectorAll("[data-page]").forEach((button) => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  const titles = {
    agenda: "Agenda",
    clients: "Clientes",
    services: "Serviços",
    team: "Equipa",
    settings: "Configurações"
  };

  if ($("pageTitle")) {
    $("pageTitle").textContent = titles[page] || "EBS Essencial";
  }

  const sidebar = $("sidebar");
  const menuButton = $("mobileMenuBtn");

  sidebar?.classList.remove("open");

  if (sidebar) {
    sidebar.style.left = "";
  }

  menuButton?.setAttribute("aria-expanded", "false");
}

/* =========================================
   9. MENU MOBILE — CORREÇÃO
========================================= */

function setupMobileMenu() {
  const button = $("mobileMenuBtn");
  const sidebar = $("sidebar");

  if (!button || !sidebar) {
    console.error("Botão ou menu lateral não encontrado.");
    return;
  }

  button.onclick = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const opened = !sidebar.classList.contains("open");

    sidebar.classList.toggle("open", opened);
    button.setAttribute("aria-expanded", String(opened));

    sidebar.style.left = opened ? "0px" : "";
  };

  document.addEventListener("click", (event) => {
    if (!sidebar.classList.contains("open")) return;

    if (
      !sidebar.contains(event.target) &&
      !button.contains(event.target)
    ) {
      sidebar.classList.remove("open");
      sidebar.style.left = "";
      button.setAttribute("aria-expanded", "false");
    }
  });
}

/* =========================================
   10. ATUALIZAÇÃO GERAL
========================================= */

function renderAll() {
  applySalonSettings();
  renderCalendar();
  renderClients();
  renderServices();
  renderProfessionals();
  refreshAppointmentOptions();
}


/* =========================================
   11. AGENDA
========================================= */

function setupAgenda() {
  $("prevDateBtn")?.addEventListener("click", () => {
    moveCalendar(-1);
  });

  $("nextDateBtn")?.addEventListener("click", () => {
    moveCalendar(1);
  });

  $("todayBtn")?.addEventListener("click", () => {
    state.currentDate = new Date();
    renderCalendar();
  });

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.currentView = button.dataset.view;

      document.querySelectorAll("[data-view]").forEach((item) => {
        item.classList.toggle("active", item === button);
      });

      renderCalendar();
    });
  });

  $("agendaDate")?.addEventListener("change", (event) => {
    if (event.target.value) {
      state.currentDate = parseDate(event.target.value);
      renderCalendar();
    }
  });

  $("professionalFilter")?.addEventListener("change", renderCalendar);

  $("newAppointmentBtn")?.addEventListener("click", () => {
    openAppointmentDialog();
  });

  renderCalendar();
}

function moveCalendar(direction) {
  const date = new Date(state.currentDate);

  if (state.currentView === "day") {
    date.setDate(date.getDate() + direction);
  } else if (state.currentView === "week") {
    date.setDate(date.getDate() + direction * 7);
  } else {
    date.setMonth(date.getMonth() + direction);
  }

  state.currentDate = date;
  renderCalendar();
}


function renderCalendar() {
  const canvas = $("calendarCanvas");
  if (!canvas) return;

  const label = $("currentDateLabel");
  const dateInput = $("agendaDate");

  if (label) {
    if (state.currentView === "month") {
      label.textContent = new Intl.DateTimeFormat("pt-PT", {
        month: "long",
        year: "numeric"
      }).format(state.currentDate);
    } else {
      label.textContent = formatDate(state.currentDate);
    }
  }

  if (dateInput) {
    dateInput.value = dateKey(state.currentDate);
  }

  if ($("todayLabel")) {
    $("todayLabel").textContent = formatTopbarDate(new Date());
  }

  if (state.currentView === "day") {
    renderDayView(canvas);
  } else if (state.currentView === "week") {
    renderWeekView(canvas);
  } else {
    renderMonthView(canvas);
  }
}


function getVisibleProfessionals() {
  const selected = $("professionalFilter")?.value || "all";

  if (selected === "all") {
    return state.professionals.filter((person) => person.active !== false);
  }

  return state.professionals.filter((person) => person.id === selected);
}

function getAppointmentsForDate(date) {
  const key = dateKey(date);

  return state.appointments.filter((appointment) => {
    return appointment.date === key;
  });
}

function getProfessionalName(id) {
  return state.professionals.find((person) => person.id === id)?.name || "Profissional";
}

function getClientName(id) {
  return state.clients.find((client) => client.id === id)?.name || "Cliente";
}

function getServiceName(id) {
  return state.services.find((service) => service.id === id)?.name || "Serviço";
}

function appointmentStatusClass(status) {
  const classes = {
    "Agendado": "agendado",
    "Confirmado": "confirmado",
    "Em atendimento": "em-atendimento",
    "Concluído": "concluido",
    "Cancelado": "cancelado",
    "Não compareceu": "nao-compareceu"
  };

  return classes[status] || "agendado";
}


function appointmentButton(appointment, spanDuration = false) {
  const whatsappLabels = {
    not_sent: "WhatsApp: por enviar",
    pending: "WhatsApp: aguardando confirmação",
    confirmed: "WhatsApp: cliente confirmado"
  };

  const whatsappStatus = appointment.whatsappStatus || "not_sent";
  const duration = Number(appointment.duration || 30);
  const height = Math.max(30, duration * (65 / 60) - 6);

  const isShort = duration <= 30;

  const spanStyle = spanDuration
    ? `style="height:${height}px"`
    : "";

  const spanClass = spanDuration
    ? (isShort ? " spans-duration short-appointment" : " spans-duration")
    : "";

  return `
    <button type="button"
      class="appointment-block${spanClass} status-${appointmentStatusClass(appointment.status)}"
      ${spanStyle}
      data-edit-appointment="${escapeHTML(appointment.id)}">

      <strong>
        ${escapeHTML(appointment.time || "")}
        · ${escapeHTML(getClientName(appointment.clientId))}
      </strong>

      ${isShort ? "" : `
        <small>${escapeHTML(getServiceName(appointment.serviceId))}</small>
        <small>${escapeHTML(appointment.status || "Agendado")}</small>
        <small>${whatsappLabels[whatsappStatus] || whatsappLabels.not_sent}</small>
      `}
    </button>
  `;
}
function attachAppointmentClicks(container) {
  container.querySelectorAll("[data-edit-appointment]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();

      const appointment = state.appointments.find(
        (item) => item.id === button.dataset.editAppointment
      );

      if (appointment) openAppointmentDialog(appointment);
    });
  });
}

/* =========================================
   12. VISTA DIÁRIA
========================================= */

function renderDayView(canvas) {
  const professionals = getVisibleProfessionals();
  const appointments = getAppointmentsForDate(state.currentDate);

  if (!professionals.length) {
    canvas.innerHTML = `
      <div class="empty-state">
        <strong>Sem profissionais</strong>
        Adicione profissionais na secção Equipa para começar a utilizar a agenda.
      </div>
    `;
    return;
  }

  const startHour = 8;
  const endHour = 20;

  canvas.innerHTML = `
    <div class="day-grid">
      <div class="day-grid-header"
        style="--professional-count:${professionals.length}">
        <div>Hora</div>
        ${professionals.map((person) => `
          <div>${escapeHTML(person.name)}</div>
        `).join("")}
      </div>

      <div class="day-grid-inner"
        style="--professional-count:${professionals.length}">

        ${Array.from({ length: endHour - startHour }, (_, index) => {
          const hour = startHour + index;

          return `
            <div class="time-cell">
              ${String(hour).padStart(2, "0")}:00
            </div>

            ${professionals.map((person) => {
              const matching = appointments.filter((appointment) => {
                return appointment.professionalId === person.id &&
                  Math.floor(timeToMinutes(appointment.time) / 60) === hour;
              });

              return `
                <div class="slot-cell"
                  data-slot-date="${dateKey(state.currentDate)}"
                  data-slot-time="${String(hour).padStart(2, "0")}:00"
                  data-slot-professional="${escapeHTML(person.id)}">

             ${matching.map((appointment) => appointmentButton(appointment, true)).join("")}
                </div>
              `;
            }).join("")}
          `;
        }).join("")}
      </div>
    </div>
  `;

  attachAppointmentClicks(canvas);

  canvas.querySelectorAll("[data-slot-date]").forEach((slot) => {
    slot.addEventListener("dblclick", () => {
      openAppointmentDialog(null, {
        date: slot.dataset.slotDate,
        time: slot.dataset.slotTime,
        professionalId: slot.dataset.slotProfessional
      });
    });
  });
}

/* =========================================
   13. VISTA SEMANAL
========================================= */

function getStartOfWeek(date) {
  const result = new Date(date);
  const day = result.getDay();

  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  result.setHours(0, 0, 0, 0);

  return result;
}

function renderWeekView(canvas) {
  const start = getStartOfWeek(state.currentDate);
  const professionals = getVisibleProfessionals();

  canvas.innerHTML = `
    <div class="week-grid">

      ${Array.from({ length: 7 }, (_, index) => {
        const day = addDays(start, index);
        const appointments = getAppointmentsForDate(day);

        return `
          <div class="week-day">
            <div class="week-day-header">
              ${new Intl.DateTimeFormat("pt-PT", {
                weekday: "short"
              }).format(day)}
              <small>${formatShortDate(day)}</small>
            </div>

            ${appointments
              .filter((appointment) => {
                return professionals.some(
                  (person) => person.id === appointment.professionalId
                );
              })
              .sort((a, b) => {
                return timeToMinutes(a.time) - timeToMinutes(b.time);
              })
              .map((appointment) => `
                <div class="week-event">
                  ${appointmentButton(appointment)}
                  <small>
                    ${escapeHTML(getProfessionalName(appointment.professionalId))}
                  </small>
                </div>
              `).join("")}
          </div>
        `;
      }).join("")}

    </div>
  `;

  attachAppointmentClicks(canvas);
}

/* =========================================
   14. VISTA MENSAL
========================================= */

function renderMonthView(canvas) {
  const year = state.currentDate.getFullYear();
  const month = state.currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = addDays(firstDay, -startOffset);

  const professionals = getVisibleProfessionals();

  const weekdays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  canvas.innerHTML = `
    <div class="month-grid">

      ${weekdays.map((day) => `
        <div class="month-weekday">${day}</div>
      `).join("")}

      ${Array.from({ length: 42 }, (_, index) => {
        const day = addDays(gridStart, index);

        const appointments = getAppointmentsForDate(day).filter((appointment) => {
          return professionals.some(
            (person) => person.id === appointment.professionalId
          );
        });

        const isToday = dateKey(day) === dateKey(new Date());
        const outsideMonth = day.getMonth() !== month;

        return `
          <div class="month-day
            ${isToday ? "today" : ""}
            ${outsideMonth ? "outside-month" : ""}">

            <div class="month-day-number">${day.getDate()}</div>

            ${appointments.slice(0, 3).map((appointment) => `
              <button type="button"
                class="month-event"
                data-edit-appointment="${escapeHTML(appointment.id)}">
                ${escapeHTML(appointment.time)}
                ${escapeHTML(getClientName(appointment.clientId))}
              </button>
            `).join("")}

            ${appointments.length > 3
              ? `<small>+${appointments.length - 3} mais</small>`
              : ""}
          </div>
        `;
      }).join("")}

    </div>
  `;

  attachAppointmentClicks(canvas);

  canvas.querySelectorAll(".month-day").forEach((element, index) => {
    element.addEventListener("dblclick", () => {
      const day = addDays(gridStart, index);

      state.currentDate = day;
      state.currentView = "day";

      document.querySelectorAll("[data-view]").forEach((button) => {
        button.classList.toggle("active", button.dataset.view === "day");
      });

      renderCalendar();
    });
  });
}

/* =========================================
   15. OPÇÕES DOS FORMULÁRIOS
========================================= */

function refreshAppointmentOptions() {
  const clientSelect = $("appointmentClient");
  const professionalSelect = $("appointmentProfessional");
  const serviceSelect = $("appointmentService");
  const filter = $("professionalFilter");

  if (clientSelect) {
    const selected = clientSelect.value;

    clientSelect.innerHTML =
      `<option value="">Selecionar cliente</option>` +
      state.clients.map((client) => `
        <option value="${escapeHTML(client.id)}">
          ${escapeHTML(client.name)}
        </option>
      `).join("");

    clientSelect.value = selected;
  }

  if (professionalSelect) {
    const selected = professionalSelect.value;

    professionalSelect.innerHTML =
      `<option value="">Selecionar profissional</option>` +
      state.professionals
        .filter((person) => person.active !== false)
        .map((person) => `
          <option value="${escapeHTML(person.id)}">
            ${escapeHTML(person.name)}
          </option>
        `).join("");

    professionalSelect.value = selected;
  }

  if (serviceSelect) {
    const selected = serviceSelect.value;

    serviceSelect.innerHTML =
      `<option value="">Selecionar serviço</option>` +
      state.services.map((service) => `
        <option value="${escapeHTML(service.id)}">
          ${escapeHTML(service.name)}
        </option>
      `).join("");

    serviceSelect.value = selected;
  }

  if (filter) {
    const selected = filter.value || "all";

    filter.innerHTML =
      `<option value="all">Todos os profissionais</option>` +
      state.professionals
        .filter((person) => person.active !== false)
        .map((person) => `
          <option value="${escapeHTML(person.id)}">
            ${escapeHTML(person.name)}
          </option>
        `).join("");

    filter.value = selected;
  }
}

/* =========================================
   16. JANELA DE MARCAÇÃO
========================================= */

function openAppointmentDialog(appointment = null, preset = {}) {
  const dialog = $("appointmentDialog");
  const form = $("appointmentForm");

  if (!dialog || !form) {
    notify("A janela de marcação não foi encontrada.", "error");
    return;
  }

  refreshAppointmentOptions();
  form.reset();

  $("appointmentId").value = appointment?.id || "";
  $("appointmentDate").value =
    appointment?.date || preset.date || dateKey(state.currentDate);

  $("appointmentTime").value =
    appointment?.time || preset.time || "09:00";

  $("appointmentClient").value = appointment?.clientId || "";
  $("appointmentProfessional").value =
    appointment?.professionalId || preset.professionalId || "";

  $("appointmentService").value = appointment?.serviceId || "";
  $("appointmentDuration").value = appointment?.duration || 30;
  $("appointmentStatus").value = appointment?.status || "Agendado";
  $("appointmentValue").value = appointment?.value ?? "";
  $("appointmentNotes").value = appointment?.notes || "";

  const title = $("appointmentDialogTitle");

  if (title) {
    title.textContent = appointment ? "Editar marcação" : "Nova marcação";
  }

  $("deleteAppointmentBtn")?.classList.toggle("hidden", !appointment);

  updateWhatsAppPanel(appointment);

  if (typeof dialog.showModal === "function") {
    if (!dialog.open) dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }
}

function updateWhatsAppPanel(appointment = null) {
  const status = $("whatsappStatus");
  const sendButton = $("whatsappAppointmentBtn");
  const registerButton = $("markWhatsAppSentBtn");
  const confirmButton = $("confirmClientBtn");

  const saved = Boolean(appointment?.id);
  const whatsappStatus = appointment?.whatsappStatus || "not_sent";

  if (status) {
    if (!saved) {
      status.textContent = "Guarde a marcação antes de utilizar o WhatsApp.";
    } else if (whatsappStatus === "confirmed") {
      status.textContent = "Cliente confirmado pelo WhatsApp.";
    } else if (whatsappStatus === "pending") {
      const date = appointment.whatsappSentAt
        ? new Date(appointment.whatsappSentAt).toLocaleString("pt-PT")
        : "";

      status.textContent = `Mensagem registada como enviada. ${date}`;
    } else {
      status.textContent = "Ainda não foi enviada nenhuma mensagem.";
    }
  }

  if (sendButton) {
    sendButton.disabled = !saved;
  }

  if (registerButton) {
    registerButton.disabled = !saved || whatsappStatus === "confirmed";
  }

  if (confirmButton) {
    confirmButton.disabled = !saved || whatsappStatus === "confirmed";
  }
}

function closeAppointmentDialog() {
  const dialog = $("appointmentDialog");

  if (!dialog) return;

  if (typeof dialog.close === "function") {
    dialog.close();
  } else {
    dialog.removeAttribute("open");
  }
}

function setupDialogButtons() {
  $("closeAppointmentDialog")?.addEventListener("click", closeAppointmentDialog);
  $("cancelAppointment")?.addEventListener("click", closeAppointmentDialog);

  $("appointmentDialog")?.addEventListener("click", (event) => {
    if (event.target === $("appointmentDialog")) {
      closeAppointmentDialog();
    }
  });
}

/* =========================================
   17. FORMULÁRIOS
========================================= */

function setupForms() {
  setupAppointmentForm();
  setupClientForm();
  setupServiceForm();
  setupProfessionalForm();
  setupDeleteAppointment();
  setupWhatsAppButton();
}

/* =========================================
   18. GUARDAR MARCAÇÕES
========================================= */

function setupAppointmentForm() {
  const form = $("appointmentForm");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const id = $("appointmentId").value;

    const appointment = {
      clientId: $("appointmentClient").value,
      professionalId: $("appointmentProfessional").value,
      serviceId: $("appointmentService").value,
      date: $("appointmentDate").value,
      time: $("appointmentTime").value,
      duration: Number($("appointmentDuration").value || 30),
      status: $("appointmentStatus").value || "Agendado",
      value: Number($("appointmentValue").value || 0),
      notes: $("appointmentNotes").value.trim()
    };

    if (
      !appointment.clientId ||
      !appointment.professionalId ||
      !appointment.serviceId ||
      !appointment.date ||
      !appointment.time
    ) {
      notify("Preencha todos os campos obrigatórios.", "error");
      return;
    }

    if (
      appointment.duration < 5 ||
      appointment.duration > 600 ||
      appointment.value < 0
    ) {
      notify("Verifique a duração e o valor da marcação.", "error");
      return;
    }

    if (!validateAppointment(appointment, id)) return;

    if (id) {
      const index = state.appointments.findIndex((item) => item.id === id);

      if (index !== -1) {
        const previous = state.appointments[index];

        state.appointments[index] = {
          ...previous,
          ...appointment,
          whatsappStatus: previous.whatsappStatus || "not_sent",
          whatsappSentAt: previous.whatsappSentAt || null,
          confirmedAt: previous.confirmedAt || null
        };

        if (appointment.status === "Confirmado") {
          state.appointments[index].whatsappStatus = "confirmed";
          state.appointments[index].confirmedAt =
            previous.confirmedAt || new Date().toISOString();
        }
      }

      notify("Marcação atualizada.");
    } else {
      state.appointments.push({
        id: createId(),
        ...appointment,
        whatsappStatus: appointment.status === "Confirmado"
          ? "confirmed"
          : "not_sent",
        whatsappSentAt: null,
        confirmedAt: appointment.status === "Confirmado"
          ? new Date().toISOString()
          : null,
        createdAt: new Date().toISOString()
      });

      notify("Marcação criada.");
    }

    saveData();
    renderCalendar();
    closeAppointmentDialog();
  });
}

/* =========================================
   19. VALIDAÇÃO DE HORÁRIOS
========================================= */

function validateAppointment(appointment, currentId = null) {
  const professional = state.professionals.find(
    (person) => person.id === appointment.professionalId
  );

  if (!professional) {
    notify("Selecione um profissional válido.", "error");
    return false;
  }

  const start = timeToMinutes(appointment.time);
  const end = start + appointment.duration;

  const workingStart = timeToMinutes(professional.start || "08:00");
  const workingEnd = timeToMinutes(professional.end || "17:00");

  if (start < workingStart || end > workingEnd) {
    notify(
      `O horário deve respeitar o horário de trabalho: ${professional.start || "08:00"}–${professional.end || "17:00"}.`,
      "error"
    );

    return false;
  }

  const hasConflict = state.appointments.some((existing) => {
    if (existing.id === currentId) return false;
    if (existing.professionalId !== appointment.professionalId) return false;
    if (existing.date !== appointment.date) return false;

    if (["Cancelado", "Não compareceu"].includes(existing.status)) {
      return false;
    }

    const existingStart = timeToMinutes(existing.time);
    const existingEnd = existingStart + Number(existing.duration || 30);
    const buffer = Number(state.bufferMinutes || 0);

    return (
      start < existingEnd + buffer &&
      end + buffer > existingStart
    );
  });

  if (hasConflict) {
    notify(
      "Este profissional já tem uma marcação nesse horário ou no intervalo de segurança.",
      "error"
    );

    return false;
  }

  return true;
}


/* =========================================
   20. APAGAR MARCAÇÃO
========================================= */

function setupDeleteAppointment() {
  $("deleteAppointmentBtn")?.addEventListener("click", () => {
    const id = $("appointmentId")?.value;

    if (!id) return;

    if (!confirm("Tem a certeza de que pretende apagar esta marcação?")) {
      return;
    }

    state.appointments = state.appointments.filter(
      (appointment) => appointment.id !== id
    );

    saveData();
    renderCalendar();
    closeAppointmentDialog();

    notify("Marcação apagada.");
  });
}

/* =========================================
   21. WHATSAPP
========================================= */

function normalizeWhatsAppPhone(phone) {
  let number = String(phone || "").replace(/\D/g, "");

  if (number.startsWith("00")) {
    number = number.slice(2);
  }

  if (number.length === 9) {
    number = "351" + number;
  }

  return number;
}

function setupWhatsAppButton() {
  $("whatsappAppointmentBtn")?.addEventListener("click", () => {
    const appointmentId = $("appointmentId")?.value;

    const appointment = state.appointments.find(
      (item) => item.id === appointmentId
    );

    if (!appointment) {
      notify("Guarde primeiro a marcação.", "error");
      return;
    }

    const client = state.clients.find(
      (item) => item.id === appointment.clientId
    );

    if (!client?.phone) {
      notify("Este cliente não tem número de telefone registado.", "error");
      return;
    }

    const phone = normalizeWhatsAppPhone(client.phone);

    if (phone.length < 10) {
      notify("O número de telefone não é válido.", "error");
      return;
    }

    const service = state.services.find(
      (item) => item.id === appointment.serviceId
    );

    const formattedDate = appointment.date
      ? new Intl.DateTimeFormat("pt-PT").format(
          parseDate(appointment.date)
        )
      : "";

    const message =
      `Olá, ${client.name}! 😊\n\n` +
      `Gostaríamos de confirmar a sua marcação:\n` +
      `Serviço: ${service?.name || "Serviço"}\n` +
      `Data: ${formattedDate}\n` +
      `Hora: ${appointment.time}\n\n` +
      `Por favor, responda a esta mensagem para confirmar. Obrigado!`;

    const whatsappUrl =
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank");

    notify(
      "Mensagem preparada. Aguarde a resposta do cliente para confirmar."
    );
  });

  $("markWhatsAppSentBtn")?.addEventListener("click", () => {
    const id = $("appointmentId")?.value;

    const appointment = state.appointments.find(
      (item) => item.id === id
    );

    if (!appointment) {
      notify("Marcação não encontrada.", "error");
      return;
    }

    if (appointment.whatsappStatus === "confirmed") {
      notify("Este cliente já está confirmado.");
      return;
    }

    appointment.whatsappStatus = "pending";
    appointment.whatsappSentAt = new Date().toISOString();

    saveData();
    updateWhatsAppPanel(appointment);
    renderCalendar();

    notify("Envio da mensagem registado.");
  });

  $("confirmClientBtn")?.addEventListener("click", () => {
    const id = $("appointmentId")?.value;

    const appointment = state.appointments.find(
      (item) => item.id === id
    );

    if (!appointment) {
      notify("Marcação não encontrada.", "error");
      return;
    }

    appointment.status = "Confirmado";
    appointment.whatsappStatus = "confirmed";
    appointment.confirmedAt = new Date().toISOString();

    $("appointmentStatus").value = "Confirmado";

    saveData();
    updateWhatsAppPanel(appointment);
    renderCalendar();

    notify("Cliente confirmado com sucesso.");
  });
}

/* =========================================
   22. CLIENTES
========================================= */

function setupClientForm() {
  const form = $("clientForm");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = $("clientName").value.trim();
    const phone = $("clientPhone").value.trim();
    const email = $("clientEmail").value.trim();

    if (!name) {
      notify("Indique o nome do cliente.", "error");
      return;
    }

    state.clients.push({
      id: createId(),
      name,
      phone,
      email
    });

    saveData();
    renderClients();
    refreshAppointmentOptions();

    form.reset();

    notify("Cliente adicionado.");
  });
}

function renderClients() {
  const list = $("clientsList");
  if (!list) return;

  if (!state.clients.length) {
    list.innerHTML = `
      <div class="empty-state">
        <strong>Sem clientes</strong>
        Os clientes adicionados aparecerão aqui.
      </div>
    `;
    return;
  }

  list.innerHTML = state.clients
    .slice()
    .sort((a, b) => (a.name || "").localeCompare(b.name || "", "pt"))
    .map((client) => `
      <div class="list-item">
        <div>
          <strong>${escapeHTML(client.name)}</strong>
          <small>
            ${escapeHTML(client.phone || "Sem telefone")}
            · ${escapeHTML(client.email || "Sem e-mail")}
          </small>
        </div>

        <button type="button"
          class="btn btn-small btn-danger"
          data-delete-client="${escapeHTML(client.id)}">
          Apagar
        </button>
      </div>
    `).join("");

  list.querySelectorAll("[data-delete-client]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.deleteClient;

      if (!confirm("Apagar este cliente?")) return;

      const hasAppointments = state.appointments.some(
        (appointment) => appointment.clientId === id
      );

      if (hasAppointments) {
        notify(
          "Este cliente tem marcações associadas. Apague ou altere primeiro essas marcações.",
          "error"
        );
        return;
      }

      state.clients = state.clients.filter((client) => client.id !== id);

      saveData();
      renderClients();
      refreshAppointmentOptions();

      notify("Cliente apagado.");
    });
  });
}

/* =========================================
   23. SERVIÇOS
========================================= */

function setupServiceForm() {
  const form = $("serviceForm");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = $("serviceName").value.trim();
    const duration = Number($("serviceDuration").value || 30);
    const price = Number($("servicePrice").value || 0);

    if (!name) {
      notify("Indique o nome do serviço.", "error");
      return;
    }

    if (duration < 5 || duration > 600 || price < 0) {
      notify("Verifique a duração e o preço do serviço.", "error");
      return;
    }

    state.services.push({
      id: createId(),
      name,
      duration,
      price
    });

    saveData();
    renderServices();
    refreshAppointmentOptions();

    form.reset();

    notify("Serviço adicionado.");
  });
}

function renderServices() {
  const list = $("servicesList");
  if (!list) return;

  if (!state.services.length) {
    list.innerHTML = `
      <div class="empty-state">
        <strong>Sem serviços</strong>
        Adicione os serviços disponíveis no salão.
      </div>
    `;
    return;
  }

  list.innerHTML = state.services.map((service) => `
    <div class="list-item">
      <div>
        <strong>${escapeHTML(service.name)}</strong>
        <small>
          ${Number(service.duration || 0)} minutos
          · ${Number(service.price || 0).toFixed(2)} €
        </small>
      </div>

      <button type="button"
        class="btn btn-small btn-danger"
        data-delete-service="${escapeHTML(service.id)}">
        Apagar
      </button>
    </div>
  `).join("");

  list.querySelectorAll("[data-delete-service]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.deleteService;

      if (!confirm("Apagar este serviço?")) return;

      const hasAppointments = state.appointments.some(
        (appointment) => appointment.serviceId === id
      );

      if (hasAppointments) {
        notify(
          "Este serviço tem marcações associadas. Altere primeiro essas marcações.",
          "error"
        );
        return;
      }

      state.services = state.services.filter((service) => service.id !== id);

      saveData();
      renderServices();
      refreshAppointmentOptions();

      notify("Serviço apagado.");
    });
  });
}

/* =========================================
   24. PROFISSIONAIS
========================================= */

function setupProfessionalForm() {
  const form = $("professionalForm");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = $("professionalName").value.trim();
    const start = $("professionalStart").value || "08:00";
    const end = $("professionalEnd").value || "17:00";

    if (!name) {
      notify("Indique o nome do profissional.", "error");
      return;
    }

    if (timeToMinutes(start) >= timeToMinutes(end)) {
      notify("O fim do horário deve ser posterior ao início.", "error");
      return;
    }

    state.professionals.push({
      id: createId(),
      name,
      start,
      end,
      active: true
    });

    saveData();
    renderProfessionals();
    refreshAppointmentOptions();
    renderCalendar();

    form.reset();

    notify("Profissional adicionado.");
  });
}

function renderProfessionals() {
  const list = $("professionalsList");
  if (!list) return;

  if (!state.professionals.length) {
    list.innerHTML = `
      <div class="empty-state">
        <strong>Sem profissionais</strong>
        Adicione os profissionais do salão.
      </div>
    `;
    return;
  }

  list.innerHTML = state.professionals.map((person) => `
    <div class="list-item">
      <div>
        <strong>${escapeHTML(person.name)}</strong>
        <small>
          ${escapeHTML(person.start || "08:00")}
          – ${escapeHTML(person.end || "17:00")}
        </small>
      </div>

      <button type="button"
        class="btn btn-small btn-danger"
        data-delete-professional="${escapeHTML(person.id)}">
        Apagar
      </button>
    </div>
  `).join("");

  list.querySelectorAll("[data-delete-professional]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.deleteProfessional;

      const hasAppointments = state.appointments.some(
        (appointment) => appointment.professionalId === id &&
          !["Cancelado", "Não compareceu"].includes(appointment.status)
      );

      if (hasAppointments) {
        notify(
          "Este profissional tem marcações associadas. Não pode ser apagado.",
          "error"
        );
        return;
      }

      if (!confirm("Apagar este profissional?")) return;

      state.professionals = state.professionals.filter(
        (person) => person.id !== id
      );

      saveData();
      renderProfessionals();
      refreshAppointmentOptions();
      renderCalendar();

      notify("Profissional apagado.");
    });
  });
}

/* =========================================
   25. INICIALIZAÇÃO ÚNICA
========================================= */

enterDemoMode();
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js")
      .then(() => {
        console.log("EBS Beauty: aplicação PWA preparada.");
      })
      .catch((error) => {
        console.error("Erro ao registar PWA:", error);
      });
  });
}
