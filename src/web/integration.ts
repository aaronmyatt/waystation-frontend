import { type Params } from "mithril";
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
  const customEvent = event as CustomEvent<{ filter?: "repos" | "public"; params?: Params; }>;
  console.log("Refresh list event received");
  try {
    let promise;
    if (customEvent.detail.filter === "repos") {
      console.log("Fetching flows from repositories");
      promise = api.repos.list();
    } else if (customEvent.detail.filter === "public" && customEvent.detail.params) {
      console.log("Fetching public flows");
      promise = api.publicFlows.list(customEvent.detail.params);  
    } else {
      console.log("Fetching all flows");
      promise = api.flows.list(customEvent.detail.params);
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

const wrapGet = async (event, cb) => {
  console.log("Request flow event received");
  const customEvent = event as CustomEvent<{ flowId: string }>;
  const { flowId } = customEvent.detail;

  try {
    await cb(flowId);
    
    console.log("Flow loaded:", flowId);
  } catch (error) {
    console.error("Error fetching flow:", error);
    // If flow not found or not authorized, clear the flow service
    if (globalThis.flowService) {
      globalThis.flowService.clear();
    }
  }
}

globalThis.addEventListener(_events.action.requestFlow, (event) => {
  if (globalThis.authService?.loggedOut) return;

  wrapGet(event, async (flowId) => {
    const response = await api.flowAggregates.get(flowId);
    const flowData = response.data;
    console.log("Fetched flow data:", flowData);

    if (globalThis.flowService) {
      globalThis.flowService.load(flowData);
    }
  })
});

globalThis.addEventListener(_events.flow.requestFlowPreview, (event) => {
  if (globalThis.authService?.loggedOut) return;

  wrapGet(event, async (flowId) => {
    const response = await api.flows.get(flowId);
    const flowData = response.data;
    console.log("Fetched flow preview data:", flowData);

    if (globalThis.flowService) {
      globalThis.flowService.loadPreview(flowData);
    }
  })
});

// Fetch Flow Preview (for markdown preview - works for both auth and public)
globalThis.addEventListener(_events.flow.requestPublicFlow, async (event) => {
  wrapGet(event, async (flowId) => {
    const response = await api.publicFlows.get(flowId);
    const flowData = response.data;
    console.log("Fetched public flow data:", flowData);

    if (globalThis.flowService) {
      globalThis.flowService.loadPreview(flowData);
    }
  });
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
const debouncedRefreshTagsList = debounce(async (event, requestTarget) => {
  try {
    const params = (event as CustomEvent<{ params?: any }>).detail.params || {};
    const response = await requestTarget(params);
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

globalThis.addEventListener(_events.tags.refreshTagsList, (event) => {
  debouncedRefreshTagsList(event, api.tags.list);
});

globalThis.addEventListener(_events.tags.refreshUserTagsList, (event) => {
  debouncedRefreshTagsList(event, api.userTags.list);
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


const debounceTagUpdate = debounce(async (event) => {
  const customEvent = event as CustomEvent<{ tag: { id: string, is_favourite: boolean } }>;
  console.log("Toggle favourite tag event received:", customEvent.detail);
  const { tag } = customEvent.detail;

  try {
    if(tag.is_favourite) {
      await api.favouriteTags.delete(tag.id);
    } else {
      await api.favouriteTags.create(tag.id);
    }

    // Refresh the tags list
    const listResponse = await api.userTags.list();
    if (globalThis.tagsListService) {
      globalThis.tagsListService.load(listResponse.data);
    }
  } catch (error) {
    console.error("Error toggling tag favourite:", error);
  }
}, 300); // 300ms debounce to prevent rapid toggles

globalThis.addEventListener(_events.tags.toggleFavourite, event => {
  debounceTagUpdate(event)
})

console.log("Flow API event listeners ready");
