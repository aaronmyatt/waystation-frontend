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
globalThis.addEventListener(_events.action.refreshList, async (event) => {
  const customEvent = event as CustomEvent<{ filter?: "repos" | "public"; user_id?: string }>;
  console.log("Refresh list event received");
  try {
    let promise;
    if (customEvent.detail.filter === "repos") {
      console.log("Fetching flows from repositories");
      promise = api.repos.list();
    } else if (customEvent.detail.filter === "public") {
      console.log("Fetching public flows");
      promise = api.publicFlows.list({ user_id: customEvent.detail?.user_id })
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

// Fetch Single Flow (for editing - requires aggregate structure)
globalThis.addEventListener(_events.action.requestFlow, async (event) => {
  console.log("Request flow event received:", event.detail.flowId);
  const { flowId } = event.detail;

  try {
    const isLoggedIn = globalThis.authService?.loggedIn;

    if (!isLoggedIn) {
      // Non-logged in users cannot edit, skip loading aggregate
      console.log("Not logged in, skipping flow aggregate load");
      return;
    }

    // Logged in users use regular flow aggregates endpoint
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
    // If flow not found or not authorized, clear the flow service
    if (globalThis.flowService) {
      globalThis.flowService.clear();
    }
  }
});

// Fetch Flow Preview (for markdown preview - works for both auth and public)
globalThis.addEventListener(_events.flow.requestFlowPreview, async (event) => {
  console.log("Request flow preview event received:", event.detail.flowId);
  const { flowId } = event.detail;

  try {
    const response = await api.publicFlows.get(flowId);

    const flowData = response.data;
    console.log("Fetched flow preview data:", flowData);

    // Update the flow service with preview data
    if (globalThis.flowService) {
      globalThis.flowService.loadPreview(flowData);
    }
    console.log("Flow preview loaded:", flowId);
  } catch (error) {
    console.error("Error fetching flow preview:", error);
  }
});

// Create/Update Flow (debounced to prevent spam)
const debouncedFlowUpdate = debounce(async () => {
  const flowData = globalThis.flowService?._flow;
  console.log("Flow updated event received", flowData);
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

    // Only update the ID for new flows (to enable routing)
    // Don't reload the entire flow to avoid triggering update loops
    globalThis.flowService.load(savedFlow);
    if (globalThis.flowService && !flowData.id && savedFlow.flow?.id) {
      globalThis.flowService._flow.flow.id = savedFlow.flow.id;
      globalThis.flowService._flow.flow.user_id = savedFlow.flow.user_id;
    }
  } catch (error) {
    console.error("Error saving flow:", error);
  }
}, 1500); // Increased from 500ms to 1500ms to reduce API calls

globalThis.addEventListener("ws::flow::updated", (event) => {
  debouncedFlowUpdate();
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

// Tags List - Refresh/Fetch all tags (debounced)
const debouncedRefreshTagsList = debounce(async (event) => {
  try {
    const params = (event as CustomEvent<{ params?: any }>).detail.params || {};
    const response = await api.tags.list(params);
    const tags = response.data;

    // Update the tags list service
    if (globalThis.tagsListService) {
      globalThis.tagsListService.load(tags);
    }
    console.log(`Loaded ${tags.rows.length} tags`, tags);
  } catch (error: any) {
    console.error("Error fetching tags:", error);
    console.error("Error response:", error.response);
    if (error.response?.status === 401) {
      console.error("Authentication failed - please log in again");
    }
  }
}, 500); // 500ms debounce, adjust as needed

globalThis.addEventListener("ws::action::refreshTagsList", (event) => {
  debouncedRefreshTagsList(event);
});

globalThis.addEventListener(_events.flow.updateFlowSingular, async (event) => {
  const customEvent = event as CustomEvent<{ flowId: string; flow: any }>;
  console.log("Update single flow event received:", customEvent.detail);
  const { flowId, flow } = customEvent.detail;

  try {
    const response = await api.flows.update(flowId, flow);
    const updatedFlow = response.data;
    console.log("Flow updated:", updatedFlow);
  } catch (error) {
    console.error("Error updating flow:", error);
  }
});

console.log("Flow API event listeners ready");
