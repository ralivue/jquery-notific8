/**
 * @author Will Steinmetz
 * notific8 Javascript plug-in
 * Copyright (c)2013-2016, Will Steinmetz
 * Licensed under the BSD license.
 * http://opensource.org/licenses/BSD-3-Clause
 */
var notific8;

notific8 = (function() {
  // var buildClose,
    // buildHeading,
    // buildMessage,
  let buildNotification,
    // checkEdges,
    // closeNotification,
    // configure,
    destroy,
    // errorMessage,
    // generateUniqueId,
    // getContainer,
    initContainers,
    // notificationClasses,
    // registerModule,
    // remove,
    removeFromQueue;//,
    // zindex;

  window.notific8Defaults = {
    life: 10000,
    theme: 'ocho',
    color: 'teal',
    sticky: false,
    verticalEdge: 'right',
    horizontalEdge: 'top',
    zindex: 1100,
    closeText: 'close',
    onInit: [],
    onCreate: [],
    onClose: [],
    namespace: 'notific8',
    queue: false,
    height: {
      atomic: 70,
      chicchat: 120,
      ocho: 90,
      materialish: 48
    }
  };
  window.notific8RegisteredModules = {
    beforeContent: [],
    afterContent: [],
    beforeContainer: [],
    afterContainer: [],
    insideContainer: []
  };
  window.notific8Queue = [];
  window.notific8DataStore = {};
  window.notific8ContainerHandlers = {
    onContainerCreate: []
  };

  /**
   * Destroy the notification
   * @param object options
   */
  destroy = function(options) {
    var body, containerClass, containers;
    containerClass = options.namespace + "-container";
    containers = document.getElementsByClassName(containerClass);
    body = document.getElementsByTagName('body')[0];
    while (containers.length > 0) {
      body.removeChild(containers[0]);
    }
  };

  /**
   * Get the container that the notification is inside of
   * @params {Object} data object defining the settings of the notification
   * @return {Object}      html DOM object for the container
   */
  function getContainer(data) {
    let { verticalEdge, horizontalEdge, namespace } = data.settings,
      containerClass = `.${namespace}-container.${verticalEdge}.${horizontalEdge}`;

    return document.querySelector(containerClass);
  };

  /**
   * Build the notification close HTML
   * @param  {Object} data object defining the settings of the notification
   * @return {String}      HTML for rendering the close button of the notification
   */
  function buildClose(data) {
    let closeClasses = [ `${data.settings.namespace}-close` ],
      closeText = '&times;';

    if (data.settings.sticky) {
      closeClasses.push('sticky');
      closeText = data.settings.closeText;
    }

    return `<div class="${closeClasses.join(' ')}">${closeText}</div>`;
  };

  /**
   * Build the HTML for the heading if it is there
   * @param  {Object} data object defining the settings of the notification
   * @return {String}      HTML for the heading part of the notification
   */
  function buildHeading(data) {
    if ((data.settings.heading !== null) && (typeof data.settings.heading === "string")) {
      return `<div class="${data.settings.namespace}-heading">${data.settings.heading}</div>`;
    } else {
      return "";
    }
  };

  /**
   * Build the message HTML for the notification
   * @param  {Object} data object defining the settings of the notification
   * @return {String}      HTML for the message part of the notification
   */
  function buildMessage(data) {
    return `<div class="${data.settings.namespace}-message">${data.message}</div>`;
  };

  /**
   * Build the list of notification classes to apply
   * @param  {Object} data object defining the settings of the notification
   * @return {Array}       array of classes to assign to the notification
   */
  function notificationClasses(data) {
    let classes;

    // @TODO remove for 5.0.0 - deprecated
    if (data.settings.theme.toLowerCase() === 'legacy') {
      data.settings.theme = 'ocho';
    }
    classes = [
      `${data.settings.namespace}-notification`,
      `family-${data.settings.theme}`,
      data.settings.theme,
      data.settings.color
    ];
    if (data.settings.sticky) {
      classes.push("sticky");
    }
    if (data.settings.heading !== null) {
      classes.push("has-heading");
    }
    return classes;
  };

  /**
   * Build the notification and add it to the screen's stack
   * @param object data
   */
  buildNotification = function(data) {
    var body, container, generatedNotificationClasses, i, j, k, len, len1, len2, module, moduleResults, namespace, notification, notificationId, num, onCreate, ref, ref1, ref2;
    body = document.getElementsByTagName('body')[0];
    num = Number(body.dataset.notific8s);
    namespace = data.settings.namespace;
    container = getContainer(data);
    num += 1;
    body.dataset.notific8s = num;
    notificationId = namespace + "-notification-" + num;
    generatedNotificationClasses = notificationClasses(data);
    notification = "<div\n  class=\"$notificationClasses\"\n  id=\"" + notificationId + "\"\n  data-name=\"" + data.settings.notificationName + "\">";
    ref = notific8RegisteredModules.beforeContent;
    for (i = 0, len = ref.length; i < len; i++) {
      module = ref[i];
      moduleResults = module.callbackMethod(data);
      generatedNotificationClasses = generatedNotificationClasses.concat(moduleResults.classes);
      notification += moduleResults.html;
    }
    notification += "<div class=\"" + data.settings.namespace + "-message-content\">\n  " + (buildHeading(data)) + "\n  " + (buildMessage(data)) + "\n</div>";
    ref1 = notific8RegisteredModules.afterContent;
    for (j = 0, len1 = ref1.length; j < len1; j++) {
      module = ref1[j];
      moduleResults = module.callbackMethod(data);
      generatedNotificationClasses = generatedNotificationClasses.concat(moduleResults.classes);
      notification += moduleResults.html;
    }
    notification += (buildClose(data)) + "\n</div>";
    notification = notification.replace('$notificationClasses', generatedNotificationClasses.join(' '));
    container.innerHTML += notification;
    setTimeout((function() {
      notification = document.getElementById(notificationId);
      if (!notification) {
        return;
      }
      return notification.style.height = data.settings.height + "px";
    }), 1);
    if (data.settings.onCreate.length) {
      ref2 = data.settings.onCreate;
      for (k = 0, len2 = ref2.length; k < len2; k++) {
        onCreate = ref2[k];
        onCreate(notification, data);
      }
    }
    setTimeout((function() {
      notification = document.getElementById(notificationId);
      if (!notification) {
        return;
      }
      notification.className += " open";
      notific8DataStore[notificationId] = data;
      if (!data.settings.sticky) {
        (function(n, l) {
          setTimeout((function() {
            closeNotification(notificationId, data);
          }), l);
        })(notification, Number(data.settings.life) + 200);
      }
    }), 5);
  };

  /**
   * Close the given notification
   * @param string notificationId
   * @param object data
   */
  function closeNotification(notificationId, data) {
    let n = document.getElementById(notificationId);

    // if something happened to cause the notifcation to be removed from the
    // screen before this method is called (such as with remove), we need to
    // return so that there isn't an error in the console
    if (n === null) {
      return;
    }

    n.className = n.className.replace('open', '');
    n.style.height = 0;

    // it's possible this method may be called in quick succession so we need
    // to isolate scope to this notification
    (function(notification, notificationId) {
      let container = getContainer(data),
        next,
        onClose,
        onCloseCallbacks;

      container.removeChild(notification);
      delete notific8DataStore[notificationId];

      if (data.settings.onClose.length) {
        onCloseCallbacks = data.settings.onClose;
        for (let i = 0, len = onCloseCallbacks.length; i < len; i++) {
          onClose = onCloseCallbacks[i];
          onClose(notification, data);
        }
      }

      // call the next notification in the queue
      if (notific8Defaults.queue && notific8Queue.length) {
        next = notific8Queue.shift();
        notific8(next.message, next.options);
      }
    })(n, notificationId);
  };

  /**
   * Set up the configuration settings
   * @param object options
   */
  function configure(options) {
    let key, option;

    for (key in options) {
      option = options[key];
      if (['onInit', 'onCreate', 'onClose'].indexOf(key) > -1) {
        if (typeof option === 'function') {
          notific8Defaults[key].push(option);
        } else {
          notific8Defaults[key] = notific8Defaults[key].concat(option);
        }
      } else if (key === 'onContainerCreate') {
        if (typeof option === 'function') {
          notific8ContainerHandlers.onContainerCreate.push(option);
        } else {
          notific8ContainerHandlers.onContainerCreate = notific8ContainerHandlers.onContainerCreate.concat(option);
        }
      } else {
        notific8Defaults[key] = option;
      }
    }
  };

  /**
   * Remove the currently visible notifications from the screen
   * @param object options
   */
  function remove(options) {
    let notificationClass = `${options.namespace}-notification`,
      notifications = document.getElementsByClassName(notificationClass);

    while (notifications.length > 0) {
      notifications[0].parentNode.removeChild(notifications[0]);
    }
  };

  /**
   * Remove the given notification names from the queue
   * @param string/array notificationNames
   */
  removeFromQueue = function(notificationNames) {
    var i, item, key, len, notification, results;
    if (typeof notificationNames !== "object") {
      notificationNames = [notificationNames];
    }
    results = [];
    for (i = 0, len = notificationNames.length; i < len; i++) {
      notification = notificationNames[i];
      results.push((function() {
        var results1;
        results1 = [];
        for (key in notific8Queue) {
          item = notific8Queue[key];
          if (notific8Queue[key].options.notificationName === notification) {
            delete notific8Queue[key];
            break;
          } else {
            results1.push(void 0);
          }
        }
        return results1;
      })());
    }
    return results;
  };

  /**
   * Set up the z-index
   * @param int z
   */
  function zindex(z) {
    notific8Defaults.zindex = z;
  };

  /**
   * Initialize the plug-in
   * @param string message
   * @param object options
   * @return object
   */
  function init(message, options) {
    var arrayKeys, data, handler, i, j, k, key, len, len1, len2, onInit, option, prop, propertiesToRemove, ref;
    data = {
      settings: {},
      message: message
    };
    arrayKeys = ['onInit', 'onCreate', 'onClose'];
    for (key in notific8Defaults) {
      option = notific8Defaults[key];
      if (key !== 'height') {
        data.settings[key] = option;
      }
    }
    for (key in options) {
      option = options[key];
      if (arrayKeys.indexOf(key) > -1) {
        if (typeof option === 'function') {
          option = [option];
        }
        for (i = 0, len = option.length; i < len; i++) {
          handler = option[i];
          data.settings[key].push(handler);
        }
      } else {
        data.settings[key] = option;
      }
    }
    propertiesToRemove = ['onContainerCreate', 'queue'];
    for (j = 0, len1 = propertiesToRemove.length; j < len1; j++) {
      prop = propertiesToRemove[j];
      delete data.settings[prop];
    }
    if (data.settings.height == null) {
      data.settings.height = notific8Defaults.height[data.settings.theme];
    }
    data.settings.height = Number(data.settings.height);
    if (data.settings.height < notific8Defaults.height[data.settings.theme]) {
      data.settings.height = notific8Defaults.height[data.settings.theme];
    }
    buildNotification(data);
    if (data.settings.onInit.length) {
      ref = data.settings.onInit;
      for (k = 0, len2 = ref.length; k < len2; k++) {
        onInit = ref[k];
        onInit(data);
      }
    }
  };

  /**
   * Initialize the containers for the plug-in
   * @param object options
   */
  initContainers = function(options) {
    var body, container, containerClasses, containerStr, handler, i, j, k, len, len1, len2, len3, len4, len5, m, modifiedContainerStr, module, moduleResults, o, p, position, ref, ref1, ref2, ref3, ref4, ref5, tempDoc;
    body = document.getElementsByTagName('body')[0];
    body.dataset.notific8s = 0;
    containerClasses = [options.namespace + "-container"];
    containerStr = "";
    ref = notific8RegisteredModules.beforeContainer;
    for (i = 0, len = ref.length; i < len; i++) {
      module = ref[i];
      moduleResults = module.callbackMethod(notific8Defaults);
      containerClasses = containerClasses.concat(moduleResults.classes);
      containerStr += moduleResults.html;
    }
    containerStr += "<div class=\"$classes $pos\">";
    ref1 = notific8RegisteredModules.insideContainer;
    for (j = 0, len1 = ref1.length; j < len1; j++) {
      module = ref1[j];
      moduleResults = module.callbackMethod(notific8Defaults);
      containerClasses = containerClasses.concat(moduleResults.classes);
      containerStr += moduleResults.html;
    }
    containerStr += "</div>";
    ref2 = notific8RegisteredModules.afterContainer;
    for (k = 0, len2 = ref2.length; k < len2; k++) {
      module = ref2[k];
      moduleResults = module.callbackMethod(notific8Defaults);
      containerClasses = containerClasses.concat(moduleResults.classes);
      containerStr += moduleResults.html;
    }
    ref3 = ['top right', 'top left', 'bottom right', 'bottom left'];
    for (m = 0, len3 = ref3.length; m < len3; m++) {
      position = ref3[m];
      modifiedContainerStr = containerStr.replace('$pos', position).replace('$classes', containerClasses.join(' '));
      tempDoc = document.implementation.createHTMLDocument('tempDoc');
      tempDoc.body.innerHTML = modifiedContainerStr;
      document.body.appendChild(tempDoc.body.firstChild);
    }
    ref4 = document.getElementsByClassName(containerClasses[0]);
    for (o = 0, len4 = ref4.length; o < len4; o++) {
      container = ref4[o];
      container.style.zIndex = notific8Defaults.zindex;
      ref5 = notific8ContainerHandlers.onContainerCreate;
      for (p = 0, len5 = ref5.length; p < len5; p++) {
        handler = ref5[p];
        handler(container, options);
      }
      container.addEventListener("click", function(event) {
        var data, notification, notificationClass, target;
        target = event.target;
        notification = target.parentElement;
        notificationClass = options.namespace + "-notification";
        if (notification.className.split(' ').indexOf(notificationClass) === -1) {
          return;
        }
        data = notific8DataStore[notification.id];
        closeNotification(notification.id, data);
      });
    }
  };

  /**
   * Make sure that the edge options are ok
   * @param object options
   */
  function checkEdges(options) {
    options.verticalEdge = (options.verticalEdge || notific8Defaults.verticalEdge).toLowerCase();
    options.horizontalEdge = (options.horizontalEdge || notific8Defaults.horizontalEdge).toLowerCase();
    if (['left', 'right'].indexOf(options.verticalEdge) === -1) {
      options.verticalEdge = notific8Defaults.verticalEdge;
    }
    if (['top', 'bottom'].indexOf(options.horizontalEdge) === -1) {
      options.horizontalEdge = notific8Defaults.horizontalEdge;
    }
  };

  /**
   * Displays an error message to the console and throws an error
   * @param string message
   */
  function errorMessage(message) {
    console.error(message);
    throw new Error(message);
  };

  /**
   * Register a module for use in the system
   * @param string moduleName
   * @param string position
   * @param object defaultOptions
   * @param function callbackMethod
   */
  function registerModule(moduleName, position, defaultOptions, callbackMethod) {
    let defaultValue,
      module,
      option,
      modulesRegisteredToPosition,
      validPositions;

    if (typeof moduleName !== 'string' || moduleName.trim() === '') {
      errorMessage("moduleName should be a string");
    }
    validPositions = ['beforeContent', 'afterContent', 'beforeContainer', 'afterContainer', 'insideContainer'];
    if (typeof position !== 'string' || validPositions.indexOf(position) > -1) {
      errorMessage("position should be a string");
    }
    if (typeof defaultOptions !== 'object') {
      errorMessage("defaultOptions should be an object");
    }
    if (typeof callbackMethod !== 'function') {
      errorMessage("callbackMethod should be an function");
    }
    modulesRegisteredToPosition = notific8RegisteredModules[position];
    for (let i = 0, len = modulesRegisteredToPosition.length; i < len; i++) {
      module = modulesRegisteredToPosition[i];
      if (module.moduleName === moduleName) {
        errorMessage(`Module '${moduleName}' has already been registered`);
      }
    }
    for (option in defaultOptions) {
      defaultValue = defaultOptions[option];
      notific8Defaults[option] = defaultValue;
    }
    return notific8RegisteredModules[position].push({
      moduleName: moduleName,
      callbackMethod: callbackMethod
    });
  };

  /**
   * Generates a unique name to assocate with the notification
   * Solution found as an answer on StackOverflow:
   * http://stackoverflow.com/a/2117523/5870787
   * @return string
   */
  function generateUniqueId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      let r, v;
      r = Math.random() * 16 | 0;
      v = c === 'x' ? r : r & 0x3 | 0x8;

      return v.toString(16);
    });
  };

  return function(message, options) {
    let callbackMethod,
      containerClass,
      defaultOptions,
      moduleName,
      notificationClass,
      num,
      position;

    if (typeof message !== "string") {
      errorMessage("notific8 takes a string message as the first parameter");
    }
    if (options === undefined) {
      options = {};
    }
    if (typeof options === 'object' && !options.hasOwnProperty('namespace') && message !== 'zindex') {
      options.namespace = 'notific8';
    }

    switch (message) {
      case "configure":
      case "config":
        return configure(options);
      case "zindex":
        return zindex(options);
      case "destroy":
        return destroy(options);
      case "remove":
        return remove(options);
      case "removeFromQueue":
        return removeFromQueue(options);
      case "registerModule":
        if (arguments.length !== 5) {
          errorMessage("Registering a module requires the parameters moduleName, position, defaultOptions, and callbackMethod.");
        }
        message = arguments[0];
        [ , moduleName, position, defaultOptions, callbackMethod ] = arguments;
        return registerModule(moduleName, position, defaultOptions, callbackMethod);
      default:
        containerClass = options.namespace + "-container";
        if (document.getElementsByClassName(containerClass).length === 0) {
          initContainers(options);
        }
        checkEdges(options);
        notificationClass = options.namespace + "-notification";
        num = document.getElementsByClassName(notificationClass).length;
        if (!options.notificationName) {
          options.notificationName = generateUniqueId();
        }
        if (!notific8Defaults.queue || num === 0) {
          init(message, options);
        } else {
          notific8Queue.push({
            message: message,
            options: options
          });
        }
        return options.notificationName;
    }
  };
})();