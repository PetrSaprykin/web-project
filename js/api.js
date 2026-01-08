// API конфиг
const API_BASE_URL = "http://exam-api-courses.std-900.ist.mospolytech.ru/api";
const API_KEY = "7d35d27d-711b-4c9e-9b60-66b6f3bf2a9d";

// API сервис
const API = {
  // создаём url с параметрами
  buildUrl(endpoint, params = {}) {
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    url.searchParams.append("api_key", API_KEY);

    Object.keys(params).forEach((key) => {
      if (
        params[key] !== null &&
        params[key] !== undefined &&
        params[key] !== ""
      ) {
        url.searchParams.append(key, params[key]);
      }
    });

    return url.toString();
  },

  // GET request
  async get(endpoint, params = {}) {
    try {
      const url = this.buildUrl(endpoint, params);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API GET Error:", error);
      throw error;
    }
  },

  // POST request
  async post(endpoint, data) {
    try {
      const url = this.buildUrl(endpoint);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API POST Error:", error);
      throw error;
    }
  },

  // PUT request
  async put(endpoint, data) {
    try {
      const url = this.buildUrl(endpoint);
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API PUT Error:", error);
      throw error;
    }
  },

  // DELETE request
  async delete(endpoint) {
    try {
      const url = this.buildUrl(endpoint);
      const response = await fetch(url, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API DELETE Error:", error);
      throw error;
    }
  },

  async getCourses() {
    return await this.get("/courses");
  },

  async getCourse(id) {
    return await this.get(`/courses/${id}`);
  },

  async getTutors() {
    return await this.get("/tutors");
  },

  async getTutor(id) {
    return await this.get(`/tutors/${id}`);
  },

  async getOrders() {
    return await this.get("/orders");
  },

  async getOrder(id) {
    return await this.get(`/orders/${id}`);
  },

  async createOrder(orderData) {
    return await this.post("/orders", orderData);
  },

  async updateOrder(id, orderData) {
    return await this.put(`/orders/${id}`, orderData);
  },

  async deleteOrder(id) {
    return await this.delete(`/orders/${id}`);
  },
};

const Notifications = {
  show(message, type = "info") {
    const notificationArea = document.getElementById("notification-area");

    const alert = document.createElement("div");
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.role = "alert";
    alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

    notificationArea.appendChild(alert);

    setTimeout(() => {
      alert.classList.remove("show");
      setTimeout(() => alert.remove(), 150);
    }, 5000);
  },

  success(message) {
    this.show(message, "success");
  },

  error(message) {
    this.show(message, "danger");
  },

  warning(message) {
    this.show(message, "warning");
  },

  info(message) {
    this.show(message, "info");
  },
};
