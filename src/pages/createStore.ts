import { configureStore,  } from '@reduxjs/toolkit';
import { throttle } from 'lodash';
import createSagaMiddleware from 'redux-saga';

import { defaultState } from '../commons/application/ApplicationTypes';
import createRootReducer from '../commons/application/reducers/RootReducer';
import MainSaga from '../commons/sagas/MainSaga';
import { generateOctokitInstance } from '../commons/utils/GitHubPersistenceHelper';
import { loadStoredState, SavedState, saveState } from './localStorage';


export const store = createStore();

export function createStore() {
  const sagaMiddleware = createSagaMiddleware();

 const store = configureStore({
    reducer: createRootReducer(), // Ensure rootReducer is updated to use createSlice
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
      serializableCheck: false,
      thunk: false
    }).concat(sagaMiddleware),
    preloadedState: loadStore(loadStoredState()), // This can replace your initialStore setup
    devTools: {
      serialize: false,
      maxAge: 300,
    }
  });
  

  sagaMiddleware.run(MainSaga);

  store.subscribe(
    throttle(() => {
      saveState(store.getState());
    }, 1000)
  );

  return store;
}

function loadStore(loadedStore: SavedState | undefined) {
  if (!loadedStore) {
    return undefined;
  }
  return {
    ...defaultState,
    session: {
      ...defaultState.session,
      ...(loadedStore.session ? loadedStore.session : {}),
      githubOctokitObject: {
        octokit: loadedStore.session.githubAccessToken
          ? generateOctokitInstance(loadedStore.session.githubAccessToken)
          : undefined
      }
    },
    workspaces: {
      ...defaultState.workspaces,
      playground: {
        ...defaultState.workspaces.playground,
        isFolderModeEnabled: loadedStore.playgroundIsFolderModeEnabled
          ? loadedStore.playgroundIsFolderModeEnabled
          : defaultState.workspaces.playground.isFolderModeEnabled,
        activeEditorTabIndex: loadedStore.playgroundActiveEditorTabIndex
          ? loadedStore.playgroundActiveEditorTabIndex.value
          : defaultState.workspaces.playground.activeEditorTabIndex,
        editorTabs: loadedStore.playgroundEditorTabs
          ? loadedStore.playgroundEditorTabs
          : defaultState.workspaces.playground.editorTabs,
        isEditorAutorun: loadedStore.playgroundIsEditorAutorun
          ? loadedStore.playgroundIsEditorAutorun
          : defaultState.workspaces.playground.isEditorAutorun,
        externalLibrary: loadedStore.playgroundExternalLibrary
          ? loadedStore.playgroundExternalLibrary
          : defaultState.workspaces.playground.externalLibrary,
        context: {
          ...defaultState.workspaces.playground.context,
          chapter: loadedStore.playgroundSourceChapter
            ? loadedStore.playgroundSourceChapter
            : defaultState.workspaces.playground.context.chapter,
          variant: loadedStore.playgroundSourceVariant
            ? loadedStore.playgroundSourceVariant
            : defaultState.workspaces.playground.context.variant
        }
      }
    },
    stories: {
      ...defaultState.stories,
      ...loadedStore.stories
    }
  };
}
