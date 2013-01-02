(function($) {
  update_state = {shadow: 0, newval: 1, leave: 2};
  
  $.fn.initialize = function() {
    var slider = this.children(".Slider");
    slider.css("height", "16px");
    options = slider.data();
    options.width = parseInt(options.width);
    slider.width = options.width;
    var leftPart = $("<div />").attr({"class": "sliderLeft"})
                            .css({"background-image": 'url("SliderLeft.png")',
                                  "width": "8px",
                                  "height": "4px",
                                  "display": "inline-block",
                                  "pointer-events":"none",
                                  });
    var middlePart = $("<div />").attr({"class": "sliderMiddle"})
                            .css({"background-image": 'url("SliderCenter.png")',
                                  "width": (options.width - 16) + "px",
                                  "height": "4px",
                                  "display": "inline-block",
                                  "pointer-events":"none",
                                  "margin-top":"6px"
                                  });
    var rightPart = $("<div />").attr({"class": "sliderRight"})
                            .css({"background-image": 'url("SliderRight.png")',
                                  "width": "8px",
                                  "height": "4px",
                                  "display": "inline-block",
                                  "pointer-events":"none"
                                  });
    leftPart.appendTo(slider);
    middlePart.appendTo(slider);
    rightPart.appendTo(slider);
    
    var knob = $("<div />").attr({"class": "sliderKnob"})
                            .css({"background-image": 'url("SliderKnob.png")',
                                  "width": "13px",
                                  "height": "13px",
                                  "display": "inline-block",
                                  "position": "relative",
                                  "top": "-8px",
                                  "z-index": "10",
                                  "pointer-events":"none"
                                  });
    knob.prevPos = 0; 
    knob.parent = slider;
    knob.gotShadow = false;
    knob.updatePosition = function(x, s) {
      var min = parseFloat(this.parent.data("min"));
      var max = parseFloat(this.parent.data("max"));
      var w = parseFloat(this.parent.data("width"));
      var prec = this.parent.data("precision") ? parseFloat(this.parent.data("precision")) : 0;
      var value = min + x * (max - min) / w;
      this.label.text("Value: " + value.toFixed(prec));
      if (s == update_state.leave || s == update_state.newval) {
        this.prevPos = x;
        if (this.shadow)
          this.shadow.remove();
        this.shadow = null;
        if (s == update_state.newval && this.parent.data("updater")) {
          //console.log(this.parent.data("updater"));
          eval(this.parent.data("updater") + "(" + value + ");");
        }
      }
      else if (!this.shadow) {
        this.shadow = $("<div />").attr({"class": "sliderShadow"})
                                  .css({"background-image": 'url("SliderMarker.png")',
                                        "width": "8px",
                                        "height": "4px",
                                        "display": "inline-block",
                                        "position": "relative",
                                        "top": "-16px",
                                        "left": (this.prevPos-16)+"px",
                                        "pointer-events":"none"
                                        });
        this.shadow.appendTo(this.parent);
      }
      this.css("left", (x-7)+"px");
    }
    knob.parent = slider;
    knob.label = this.children(".SliderLabel").attr({"class": "sliderLabel"})
                        .css({"pointer-events":"none",
                              "display": "inline-block",
                              "position": "relative",
                              "top": "2px",
                              "height": "0px",
                              "text-align": "right",
                              "width": "100%",
                              });
    knob.label.prependTo(this);
    //console.log(knob.label);
    if (slider.data("default")) {
      var min = parseFloat(slider.data("min"));
      var max = parseFloat(slider.data("max"));
      var w = parseFloat(slider.data("width"));
      var x = (parseFloat(slider.data("default")) - min) * w / (max - min);
      knob.updatePosition(x, update_state.newval);
    }
    else
      knob.updatePosition(0, update_state.newval);
    
    var mouseDown = false;
    slider.on("mousedown", {knob:knob}, function(e) {
      e.data.knob.updatePosition(e.offsetX, update_state.newval);
      mouseDown = true;
    });
    slider.on("mouseup", function() {mouseDown = false; });
    slider.on("mousemove", {knob:knob}, function(e) {
      if (mouseDown)
        e.data.knob.updatePosition(e.offsetX, update_state.newval);
      else if (Math.abs(e.data.knob.prevPos - e.offsetX) > 7 || e.data.knob.shadow) {
        e.data.knob.updatePosition(e.offsetX, update_state.shadow);
      }
    });
    slider.on("mouseleave", {knob:knob}, function(e) {
      mouseDown = false;
      e.data.knob.updatePosition(e.data.knob.prevPos, update_state.leave);
    });
    knob.appendTo(slider);
  }
})(jQuery);
