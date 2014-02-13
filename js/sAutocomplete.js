/*
 * Autocomplete plugin
 * @created 2012-02-29
 * @author: Snir Segal. copyright reserved :)
 * @updated 2013-11-24
 * @version 2.3
 */

jQuery.fn.extend({
	sAutocomplete: function(options) {
		return this.each(function() {
			new jQuery.sAutocomplete(this,options);
		});
	}
});


window.sAutocomplete = { 
			eventClickHide : false // Holds the eventClickHide status, if we already attached an event of click to hide the autocomplete
};

jQuery.sAutocomplete = function(inputObj,options) {

	var $obj = jQuery(inputObj);
	var objId = $obj.attr('id');
	if (objId == undefined)
	{
		objId = $obj.attr('name');
		$obj.attr('id', objId);
	}
	
	$obj.attr('autocomplete','off');

    var opt = jQuery.extend( {
        'ac_wrap_style': 'sAutocomplete_wrap',
        'ac_inner_style': 'sAutocomplete',
        'ac_list_style': 'sAutocomplete',

        'width': '130px',

        'minLetters' : 2,

        ajaxDelayTime : 500, // how many milliseconds to delay the ajax before it fires it up

        'ajaxFile': '',
        'fieldsDepend': true,
        'paramsFields': "",
        'params': "",

        // for passing a function to initialize after clicking an option from the auto complete
        'afterCompleteClick': null,
        // for passing a function to initialize after every typing
        'onTyping': null,
        // for passing a function to initialize after blur from the input
        'onBlur': null,

        // for passing a function to customize the autocomplete list
        'customizeAc': null
    }, options);

    var _ajaxDelayTimerObj = null;

	$obj.keydown(function(event) {
		_do.up_down_select(event);
	});

    if (opt.onBlur != null && typeof opt.onBlur == "function") {
        $obj.on('blur', function() {
            opt.onBlur($obj);
        });
    }

    $obj.on('blur', function() {
        setTimeout(function() {
            jQuery("#"+objId+"_autocomplete").hide();
        },500);
    });

    var _currentOption = 0; // currentOption
    var _totalItems = 0; // total items

    var _setTotalItems = function(data) {
        var items = 0;
        jQuery.each(data, function(index,value) {
            items++;
        });
        _totalItems = items;
    }

	var _do = {
		bindInput : function() {
			$obj.keyup(function(event) {
				if (!event)
					var event = window.event;
				if (event.keyCode)
					key = event.keyCode;
				else if (event.which)
					key = event.which;
				
				/*
				 * keys:
				 * 13 - enter
				 * 37 - left arrow
				 * 39 - right arrow
				 * 38 - up arrow
				 * 40 - down arrow
				 */
				if(key != 38 && key != 40 && key!= 13 && key != 37 && key != 39) {
					
					$obj.removeAttr('data-autocomplete-chosen-id');
					
					if (opt.onTyping != null && typeof opt.onTyping == "function") {
						opt.onTyping($obj);
					}
					if (opt.customizeAc == null && opt.customizeAc == undefined) {
						_do.getList();
					}
					else {
                        _do.retrieveData(function(data) {
                            opt.customizeAc(data, $obj);
                        });
					}
				}
			});
		},
		up_down_select : function(evtobj)
		{
			var keycode= evtobj.charCode ? evtobj.charCode : evtobj.keyCode ;
			
			switch (keycode)
			{
				case 38:
						evtobj.preventDefault();
						_do.goUp();
					break;
				case 40:
						evtobj.preventDefault();
						_do.goDown();
					break;
				case 13:
					if (jQuery("#"+objId+"_autocomplete").is(":visible"))
					{
						evtobj.preventDefault();
						_do.selectItem();
					}
				break;
				/*case 9:
						closeAuto();
					break;*/
			}
		},
		goUp : function()
		{
			var div = document.getElementById(objId+"_autocomplete");
			
			if( div != null)
			{
				
				if(div.style.display != "none")
                {
                    var prevItem = $("#sAutocomplete_"+objId+_currentOption);

                    if (_currentOption > 1) {
                        _currentOption--;
                    }
                    else {
                        _currentOption = _totalItems;
                    }
                    var currItem = $("#sAutocomplete_"+objId+_currentOption);

                    if (prevItem.length > 0) {
                        prevItem.css('background-color','white');
                    }
                    if (currItem.length > 0) {
                        currItem.css('background-color', '#E4F0FF');
                    }

				}
			}
		},
		goDown : function() 
		{
			var div = document.getElementById(objId+"_autocomplete");
				
			if( div != null){
				
				if(div.style.display != "none")
				{
                    var prevItem = $("#sAutocomplete_"+objId+_currentOption)

                    if (_currentOption+1 <= _totalItems) {
                        _currentOption++;
                    }
                    else {
                        _currentOption = 1;
                    }

                    var currItem = $("#sAutocomplete_"+objId+_currentOption);
                    if (prevItem.length > 0) {
                        prevItem.css('background-color','white');
                    }
                    if (currItem.length > 0) {
                        currItem.css('background-color', '#E4F0FF');
                    }
				}
			}
		},
		buildAutocomplete : function() {
			var $autocomplete_div = jQuery('<div data-sAutocomplete="true" class="'+opt.ac_wrap_style+'" id="'+objId+'_autocomplete" style="display: none;">'
						+ '<div class="'+opt.ac_inner_style+'" id="'+objId+'_autocomplete_inner" style="width: '+opt.width+';"></div></div>');
	
			$obj.after($autocomplete_div);
			
			/*
			 * We're doing this check of jQuery version because of lack of support
			 * of somethings in versions under 1.7 :-(
			 */
			if (parseFloat(jQuery.fn.jquery).toString().substr(0,1) >= 1 || parseFloat(jQuery.fn.jquery).toFixed(2).toString().substr(2) >= 7) {
				
				if (!window.sAutocomplete.eventClickHide) {
					jQuery(document).bind('click', function(e) {
						
						var targetId = jQuery(e.target).attr('id');

                        try {
						    var openedAutocomplete = $("div[data-sAutocomplete='true']:visible").attr('id');
                        }
                        catch(e) {
                            var openedAutocomplete = null;
                        }

						if (openedAutocomplete != undefined && openedAutocomplete != "" && openedAutocomplete != null) {
							
							var elmId = openedAutocomplete.replace("_autocomplete","");
							
							if (targetId != openedAutocomplete && targetId != elmId) {
								jQuery("#"+openedAutocomplete).hide();
							}

						}
					});
					window.sAutocomplete.eventClickHide = true;
				}
			}
		},
		retrieveData : function(callback) {
			var paramsFields = "";

				if (opt.paramsFields != "" && typeof opt.paramsFields == "object")
				{
					jQuery.each(opt.paramsFields, function(index,value) {
						if (value != null && typeof value != "undefined") {
                            if (typeof value == "string" && typeof document.getElementById(value) != "undefined" && document.getElementById(value) != null) {
                                var value = document.getElementById(value).value;
                                if (value != "") {
                                    paramsFields += "&"+index+"="+jQuery.base64Encode(value);
                                }
                            }
                            else {
                                if (typeof value == "function") {
                                    var value = value();
                                    if (value != "") {
                                        paramsFields += "&"+index+"="+value();
                                    }
                                }
                            }
						}
					});

                    if (paramsFields == "" && opt.fieldsDepend == true) {
                        return false;
                    }
				}

				var params = "";
				if (opt.params != null && opt.params != "")
					params = opt.params;

                clearTimeout(_ajaxDelayTimerObj);
                _ajaxDelayTimerObj = setTimeout(function() {
                    jQuery.ajax({
                        type: "GET",
                        url: opt.ajaxFile,
                        data: "keyword="+jQuery.base64Encode($obj.val())+paramsFields+params,
                        dataType: 'json',
                        beforeSend: function() {},
                        success: function(data)
                        {
                            if (data != null && typeof callback == "function")
                            {
                                _setTotalItems(data);
                                callback(data);
                            }
                        }
                    });
                }, opt.ajaxDelayTime);
		},
		getList : function() {
			if ($obj.val().length >= opt.minLetters)
			{
				var paramsFields = "";
				
				if (opt.paramsFields != null)
				{
					jQuery.each(opt.paramsFields, function(index,value) {
						
						var value = document.getElementById(value).value;
						
						paramsFields += "&"+index+"="+jQuery.base64Encode(value);
					});
				}
				
				var params = "";
				if (opt.params != null && opt.params != "")
					params = opt.params;
				
				_do.retrieveData(function(data) {
                    _do.buildList(data);
                });

			}
			else
			{
				jQuery("#"+objId+"_autocomplete").hide();
			}
		},

        buildList : function(data) {
            if (data != null && typeof data == "object")
            {
                var $ul_list = jQuery('<ul class="'+opt.ac_list_style+'" id="'+objId+'_autocomplete_list"></ul>');

                jQuery.each(data, function(index,value)
                {
                    var Title = value.title;
                    var Title_bold = Title.replace($obj.val(), '<b>'+$obj.val()+'</b>');

                    var $aHref = jQuery('<a href="javascript:void(0);" id="sAutocomplete_'+objId+value.i+'">' + Title_bold + '</a>');

                    $aHref.click(function() {
                        _do.setItem(value);
                    });

                    var $span = jQuery('<span id="sAutocomplete_'+objId+'Name'+value.i+'" style="display: none;">'+Title+'</span>');

                    var $li = jQuery('<li></li>');
                    $li.append($aHref).append($span);

                    $ul_list.append($li);
                });

                jQuery("#"+objId+"_autocomplete_inner").html($ul_list);

                jQuery("#"+objId+"_autocomplete").show();
            }
            else
            {
                jQuery("#"+objId+"_autocomplete").hide();
            }
        },

		setItem : function(value)
		{
			jQuery("#"+objId).val(value.title);
			jQuery("#"+objId).attr('data-autocomplete-chosen-id', value.id);
			jQuery("#"+objId+"_autocomplete").hide();
			
		    if (opt.afterCompleteClick != null && typeof opt.afterCompleteClick == "function")
				opt.afterCompleteClick(value);
		},
		selectItem : function()
		{
			var div = document.getElementById(objId+"_autocomplete");
			if( div != null){
				if(div.style.display != "none")
				{
                    $("#sAutocomplete_"+objId+_currentOption).click();
				}
			}
		}
	};

	if (opt.customizeAc == null && opt.customizeAc == undefined) {
		_do.buildAutocomplete();
	}

	_do.bindInput();
};