define(["exports", "aurelia-dependency-injection", "aurelia-templating", "aurelia-router", "aurelia-metadata", "aurelia-path"], function (exports, _aureliaDependencyInjection, _aureliaTemplating, _aureliaRouter, _aureliaMetadata, _aureliaPath) {
  "use strict";

  var Container = _aureliaDependencyInjection.Container;
  var CustomElement = _aureliaTemplating.CustomElement;
  var ViewSlot = _aureliaTemplating.ViewSlot;
  var ViewStrategy = _aureliaTemplating.ViewStrategy;
  var UseView = _aureliaTemplating.UseView;
  var NoView = _aureliaTemplating.NoView;
  var Router = _aureliaRouter.Router;
  var Origin = _aureliaMetadata.Origin;
  var relativeToFile = _aureliaPath.relativeToFile;


  function makeViewRelative(executionContext, viewPath) {
    var origin = Origin.get(executionContext.constructor);
    return relativeToFile(viewPath, origin.moduleId);
  }

  var RouterView = (function () {
    var RouterView = function RouterView(element, container, viewSlot) {
      this.element = element;
      this.container = container;
      this.viewSlot = viewSlot;
    };

    RouterView.annotations = function () {
      return [new CustomElement("router-view"), new NoView()];
    };

    RouterView.inject = function () {
      return [Element, Container, ViewSlot];
    };

    RouterView.prototype.created = function (executionContext) {
      this.executionContext = executionContext;

      if ("router" in executionContext) {
        executionContext.router.registerViewPort(this, this.element.getAttribute("name"));
      }
    };

    RouterView.prototype.bind = function (executionContext) {
      if (this.executionContext == executionContext) {
        return;
      }

      if ("router" in executionContext) {
        this.executionContext = executionContext;
        executionContext.router.registerViewPort(this, this.element.getAttribute("name"));
      }
    };

    RouterView.prototype.getComponent = function (viewModelType, createChildRouter, config) {
      var childContainer = this.container.createChild(), viewStrategy = config.view || config.viewStrategy, viewModel;

      childContainer.registerHandler(Router, createChildRouter);
      childContainer.autoRegister(viewModelType);

      viewModel = childContainer.get(viewModelType);

      if ("getViewStrategy" in viewModel && !viewStrategy) {
        viewStrategy = viewModel.getViewStrategy();
      }

      if (typeof viewStrategy === "string") {
        viewStrategy = new UseView(makeViewRelative(this.executionContext, viewStrategy));
      }

      if (viewStrategy && !(viewStrategy instanceof ViewStrategy)) {
        throw new Error("The view must be a string or an instance of ViewStrategy.");
      }

      CustomElement.anonymous(this.container, viewModel, viewStrategy).then(function (behaviorType) {
        return behaviorType.create(childContainer, { executionContext: viewModel, suppressBind: true });
      });
    };

    RouterView.prototype.process = function (viewPortInstruction) {
      viewPortInstruction.component.bind(viewPortInstruction.component.executionContext);
      this.viewSlot.swap(viewPortInstruction.component.view);

      if (this.view) {
        this.view.unbind();
      }

      this.view = viewPortInstruction.component.view;
    };

    return RouterView;
  })();

  exports.RouterView = RouterView;
});