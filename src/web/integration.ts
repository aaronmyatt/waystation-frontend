import { api } from "../shared/api-client";
import { storageKeys, _events } from "../shared/utils";


globalThis.addEventListener(_events.auth.logout, (event) => {
  console.log("Logout event received");
  api.auth
    .logout()
    .catch((error) => {
      console.error("Logout error:", error);
    })
    .finally(() => {
      globalThis.authService.logout();
    });
})

globalThis.addEventListener(_events.auth.login, (event) => {
  console.log("Login event received:", event.detail);
  const { email, password } = event.detail;

  // Make API call to backend
  api.auth
    .login(email, password)
    .then(({data}) => {
      if (data.error) {
        globalThis.authService?.setError(data.error);
      } else if (data.api_token) {
        localStorage.setItem(storageKeys.authToken, data.api_token);
        localStorage.setItem(storageKeys.user, JSON.stringify(data.user || {}));

        if (data.message) {
          globalThis.authService?.setSuccess(data.message);
        }
      }
    })
    .catch((error) => {
      console.error("Login error:", error);
      globalThis.authService?.setError("Network error. Please try again.");
    })
    .finally(() => {
      globalThis.authService?.setLoading(false);
    });
});

globalThis.addEventListener(_events.auth.register, (event) => {
  console.log("Register event received:", event.detail);
  const { email, password } = event.detail;

  // Generate username from email (before @ sign)
  const username = email.split("@")[0];

  // Make API call to backend
  api.auth
    .register(email, password, username)
    .then(({data}) => {
      if (data.errors) {
        globalThis.authService?.setError(data.errors.join(", "));
      } else if (data.error) {
        globalThis.authService?.setError(data.error);
      } else if (data.api_token) {
        localStorage.setItem(storageKeys.authToken, data.api_token);
        localStorage.setItem(storageKeys.user, JSON.stringify(data.user || {}));
        // Store API token
        if (data.message) {
          globalThis.authService?.setSuccess(data.message);
        }
      }
    })
    .catch((error) => {
      console.error("Registration error:", error);
      globalThis.authService?.setError("Network error. Please try again.");
    })
    .finally(() => {
      globalThis.authService?.setLoading(false);
    });
});

// Wait for API client to be available from bundle
// Debounce helper function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Flow List - Refresh/Fetch all flows
globalThis.addEventListener("ws::action::refreshList", async (event) => {
  const customEvent = event as CustomEvent<{ filter?: "repos" | "public" }>;
  console.log("Refresh list event received");
  try {
    let promise;
    if (customEvent.detail.filter === "repos") {
      console.log("Fetching flows from repositories");
      promise = api.repos.list();
    } else if (customEvent.detail.filter === "public") {
      console.log("Fetching public flows");
      promise = customEvent.detail.username ? api.publicFlows.userFlows({ username: customEvent.detail.username }) : api.publicFlows.list();
    } else {
      console.log("Fetching all flows");
      promise = api.flows.list();
    }

    const response = await promise;
    const flows = response.data.rows;
    // Update the flow list service
    globalThis.flowListService.load(flows);
    console.log(`Loaded ${flows.length} flows`);
  } catch (error) {
    globalThis.flowListService.load([]);
    console.error("Error fetching flows:", error);
  }
});

// Fetch Single Flow
globalThis.addEventListener("ws::action::requestFlow", async (event) => {
  console.log("Request flow event received:", event.detail.flowId);
  const { flowId } = event.detail;

  try {
    const response = await api.flowAggregates.get(flowId);
    const flowData = response.data;
    console.log("Fetched flow data:", flowData);

    // Update the flow service
    if (globalThis.flowService) {
      globalThis.flowService.load(flowData);
    }
    console.log("Flow loaded:", flowId);
  } catch (error) {
    console.error("Error fetching flow:", error);
  }
});

// Fetch Single Flow
globalThis.addEventListener(_events.flow.requestFlowPreview, async (event) => {
  console.log("Request flow event received:", event.detail.flowId);
  const { flowId } = event.detail;

  try {
    const response = await api.flows.get(flowId);
    const flowData = response.data;
    console.log("Fetched flow data:", flowData);

    // Update the flow service
    if (globalThis.flowService) {
      globalThis.flowService.loadPreview(flowData);
    }
    console.log("Flow loaded:", flowId);
  } catch (error) {
    console.error("Error fetching flow:", error);
  }
});

// Create/Update Flow (debounced to prevent spam)
const debouncedFlowUpdate = debounce(async (flowData) => {
  console.log("Flow updated event received");
  try {
    let promise;
    if (!flowData.id) {
      promise = api.flowAggregates.create(flowData);
    } else {
      promise = api.flowAggregates.update(flowData.id, flowData);
    }
    const response = await promise;
    const savedFlow = response.data;
    console.log("Flow saved:", savedFlow);

    // Update the flow service
    if (globalThis.flowService) {
      globalThis.flowService.load(savedFlow);
    }
  } catch (error) {
    console.error("Error saving flow:", error);
  }
}, 500);

globalThis.addEventListener("ws::flow::updated", (event) => {
  const customEvent = event as CustomEvent<any>;
  debouncedFlowUpdate(customEvent.detail);
});

// Delete Flow
globalThis.addEventListener("ws::action::deleteFlow", async (event) => {
  const customEvent = event as CustomEvent<{ flow: { id: string } }>;
  console.log("Delete flow event received:", customEvent.detail);
  const { id: flowId } = customEvent.detail.flow;

  try {
    await api.flows.delete(flowId);
    console.log("Flow deleted:", flowId);

    // Refresh the flow list
    const response = await api.flows.list();
    globalThis.flowListService.load(response.data.rows);
  } catch (error) {
    console.error("Error deleting flow:", error);
  }
});

// Tags List - Refresh/Fetch all tags
globalThis.addEventListener("ws::action::refreshTagsList", async (event) => {
  try {
    const response = await api.tags.list();
    const tags = response.data.tags;

    // Update the tags list service
    if (globalThis.tagsListService) {
      globalThis.tagsListService.load(tags);
    }
    console.log(`Loaded ${tags.length} tags`, tags);
  } catch (error: any) {
    console.error("Error fetching tags:", error);
    console.error("Error response:", error.response);
    if (error.response?.status === 401) {
      console.error("Authentication failed - please log in again");
    }
  }
});

console.log("Flow API event listeners ready");
