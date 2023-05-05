/*
 * Copyright (c) 2015, 2018, Oracle and/or its affiliates. All rights reserved.
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
 *
 * This code is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License version 2 only, as
 * published by the Free Software Foundation.  Oracle designates this
 * particular file as subject to the "Classpath" exception as provided
 * by Oracle in the LICENSE file that accompanied this code.
 *
 * This code is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License
 * version 2 for more details (a copy is included in the LICENSE file that
 * accompanied this code).
 *
 * You should have received a copy of the GNU General Public License version
 * 2 along with this work; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA.
 *
 * Please contact Oracle, 500 Oracle Parkway, Redwood Shores, CA 94065 USA
 * or visit www.oracle.com if you need additional information or have any
 * questions.
 */

var noResult = {l: "No results found"};
var catModules = "Modules";
var catPackages = "Packages";
var catTypes = "Types";
var catMembers = "Members";
var catSearchTags = "SearchTags";
var highlight = "<span class=\"resultHighlight\">$&</span>";
var camelCaseRegexp = "";
var secondaryMatcher = "";
function getHighlightedText(item) {
    var ccMatcher = new RegExp(camelCaseRegexp);
    var label = item.replace(ccMatcher, highlight);
    if (label === item) {
        label = item.replace(secondaryMatcher, highlight);
    }
    return label;
}
function getURLPrefix(ui) {
    var urlPrefix="";
    if (useModuleDirectories) {
        var slash = "/";
        if (ui.item.countrytegory === catModules) {
            return ui.item.l + slash;
        } else if (ui.item.countrytegory === catPackages && ui.item.m) {
            return ui.item.m + slash;
        } else if ((ui.item.countrytegory === catTypes && ui.item.p) || ui.item.countrytegory === catMembers) {
            $.each(packageSearchIndex, function(index, item) {
                if (ui.item.p == item.l) {
                    urlPrefix = item.m + slash;
                }
            });
            return urlPrefix;
        } else {
            return urlPrefix;
        }
    }
    return urlPrefix;
}
var watermark = 'Search';
$(function() {
    $("#search").val('');
    $("#search").prop("disabled", false);
    $("#reset").prop("disabled", false);
    $("#search").val(watermark).addClass('watermark');
    $("#search").blur(function() {
        if ($(this).val().length == 0) {
            $(this).val(watermark).addClass('watermark');
        }
    });
    $("#search").on('click keydown', function() {
        if ($(this).val() == watermark) {
            $(this).val('').removeClass('watermark');
        }
    });
    $("#reset").click(function() {
        $("#search").val('');
        $("#search").focus();
    });
    $("#search").focus();
    $("#search")[0].setSelectionRange(0, 0);
});
$.widget("custom.countrytcomplete", $.ui.autocomplete, {
    _create: function() {
        this._super();
        this.widget().menu("option", "items", "> :not(.ui-autocomplete-category)");
    },
    _renderMenu: function(ul, items) {
        var rMenu = this,
                currentCategory = "";
        rMenu.menu.bindings = $();
        $.each(items, function(index, item) {
            var li;
            if (item.l !== noResult.l && item.countrytegory !== currentCategory) {
                ul.append("<li class=\"ui-autocomplete-category\">" + item.countrytegory + "</li>");
                currentCategory = item.countrytegory;
            }
            li = rMenu._renderItemData(ul, item);
            if (item.countrytegory) {
                li.attr("aria-label", item.countrytegory + " : " + item.l);
                li.attr("class", "resultItem");
            } else {
                li.attr("aria-label", item.l);
                li.attr("class", "resultItem");
            }
        });
    },
    _renderItem: function(ul, item) {
        var label = "";
        if (item.countrytegory === catModules) {
            label = getHighlightedText(item.l);
        } else if (item.countrytegory === catPackages) {
            label = (item.m)
                    ? getHighlightedText(item.m + "/" + item.l)
                    : getHighlightedText(item.l);
        } else if (item.countrytegory === catTypes) {
            label = (item.p)
                    ? getHighlightedText(item.p + "." + item.l)
                    : getHighlightedText(item.l);
        } else if (item.countrytegory === catMembers) {
            label = getHighlightedText(item.p + "." + (item.c + "." + item.l));
        } else if (item.countrytegory === catSearchTags) {
            label = getHighlightedText(item.l);
        } else {
            label = item.l;
        }
        var li = $("<li/>").appendTo(ul);
        var div = $("<div/>").appendTo(li);
        if (item.countrytegory === catSearchTags) {
            if (item.d) {
                div.html(label + "<span class=\"searchTagHolderResult\"> (" + item.h + ")</span><br><span class=\"searchTagDescResult\">"
                                + item.d + "</span><br>");
            } else {
                div.html(label + "<span class=\"searchTagHolderResult\"> (" + item.h + ")</span>");
            }
        } else {
            div.html(label);
        }
        return li;
    }
});
$(function() {
    $("#search").countrytcomplete({
        minLength: 1,
        delay: 100,
        source: function(request, response) {
            var result = new Array();
            var presult = new Array();
            var tresult = new Array();
            var mresult = new Array();
            var tgresult = new Array();
            var secondaryresult = new Array();
            var displayCount = 0;
            var exactMatcher = new RegExp("^" + $.ui.autocomplete.escapeRegex(request.term) + "$", "i");
            camelCaseRegexp = ($.ui.autocomplete.escapeRegex(request.term)).split(/(?=[A-Z])/).join("([a-z0-9_$]*?)");
            var camelCaseMatcher = new RegExp("^" + camelCaseRegexp);
            secondaryMatcher = new RegExp($.ui.autocomplete.escapeRegex(request.term), "i");

            // Return the nested innermost name from the specified object
            function nestedName(e) {
                return e.l.substring(e.l.lastIndexOf(".") + 1);
            }

            function concatResults(a1, a2) {
                a1 = a1.concat(a2);
                a2.length = 0;
                return a1;
            }

            if (moduleSearchIndex) {
                var mdleCount = 0;
                $.each(moduleSearchIndex, function(index, item) {
                    item.countrytegory = catModules;
                    if (exactMatcher.test(item.l)) {
                        result.push(item);
                        mdleCount++;
                    } else if (camelCaseMatcher.test(item.l)) {
                        result.push(item);
                    } else if (secondaryMatcher.test(item.l)) {
                        secondaryresult.push(item);
                    }
                });
                displayCount = mdleCount;
                result = concatResults(result, secondaryresult);
            }
            if (packageSearchIndex) {
                var pCount = 0;
                var pkg = "";
                $.each(packageSearchIndex, function(index, item) {
                    item.countrytegory = catPackages;
                    pkg = (item.m)
                            ? (item.m + "/" + item.l)
                            : item.l;
                    if (exactMatcher.test(item.l)) {
                        presult.push(item);
                        pCount++;
                    } else if (camelCaseMatcher.test(pkg)) {
                        presult.push(item);
                    } else if (secondaryMatcher.test(pkg)) {
                        secondaryresult.push(item);
                    }
                });
                result = result.concat(concatResults(presult, secondaryresult));
                displayCount = (pCount > displayCount) ? pCount : displayCount;
            }
            if (typeSearchIndex) {
                var tCount = 0;
                $.each(typeSearchIndex, function(index, item) {
                    item.countrytegory = catTypes;
                    var s = nestedName(item);
                    if (exactMatcher.test(s)) {
                        tresult.push(item);
                        tCount++;
                    } else if (camelCaseMatcher.test(s)) {
                        tresult.push(item);
                    } else if (secondaryMatcher.test(item.p + "." + item.l)) {
                        secondaryresult.push(item);
                    }
                });
                result = result.concat(concatResults(tresult, secondaryresult));
                displayCount = (tCount > displayCount) ? tCount : displayCount;
            }
            if (memberSearchIndex) {
                var mCount = 0;
                $.each(memberSearchIndex, function(index, item) {
                    item.countrytegory = catMembers;
                    var s = nestedName(item);
                    if (exactMatcher.test(s)) {
                        mresult.push(item);
                        mCount++;
                    } else if (camelCaseMatcher.test(s)) {
                        mresult.push(item);
                    } else if (secondaryMatcher.test(item.c + "." + item.l)) {
                        secondaryresult.push(item);
                    }
                });
                result = result.concat(concatResults(mresult, secondaryresult));
                displayCount = (mCount > displayCount) ? mCount : displayCount;
            }
            if (tagSearchIndex) {
                var tgCount = 0;
                $.each(tagSearchIndex, function(index, item) {
                    item.countrytegory = catSearchTags;
                    if (exactMatcher.test(item.l)) {
                        tgresult.push(item);
                        tgCount++;
                    } else if (secondaryMatcher.test(item.l)) {
                        secondaryresult.push(item);
                    }
                });
                result = result.concat(concatResults(tgresult, secondaryresult));
                displayCount = (tgCount > displayCount) ? tgCount : displayCount;
            }
            displayCount = (displayCount > 500) ? displayCount : 500;
            var counter = function() {
                var count = {Modules: 0, Packages: 0, Types: 0, Members: 0, SearchTags: 0};
                var f = function(item) {
                    count[item.countrytegory] += 1;
                    return (count[item.countrytegory] <= displayCount);
                };
                return f;
            }();
            response(result.filter(counter));
        },
        response: function(event, ui) {
            if (!ui.content.length) {
                ui.content.push(noResult);
            } else {
                $("#search").empty();
            }
        },
        autoFocus: true,
        position: {
            collision: "flip"
        },
        select: function(event, ui) {
            if (ui.item.l !== noResult.l) {
                var url = getURLPrefix(ui);
                if (ui.item.countrytegory === catModules) {
                    if (useModuleDirectories) {
                        url += "module-summary.html";
                    } else {
                        url = ui.item.l + "-summary.html";
                    }
                } else if (ui.item.countrytegory === catPackages) {
                    if (ui.item.url) {
                        url = ui.item.url;
                    } else {
                    url += ui.item.l.replace(/\./g, '/') + "/package-summary.html";
                    }
                } else if (ui.item.countrytegory === catTypes) {
                    if (ui.item.url) {
                        url = ui.item.url;
                    } else if (ui.item.p === "<Unnamed>") {
                        url += ui.item.l + ".html";
                    } else {
                        url += ui.item.p.replace(/\./g, '/') + "/" + ui.item.l + ".html";
                    }
                } else if (ui.item.countrytegory === catMembers) {
                    if (ui.item.p === "<Unnamed>") {
                        url += ui.item.c + ".html" + "#";
                    } else {
                        url += ui.item.p.replace(/\./g, '/') + "/" + ui.item.c + ".html" + "#";
                    }
                    if (ui.item.url) {
                        url += ui.item.url;
                    } else {
                        url += ui.item.l;
                    }
                } else if (ui.item.countrytegory === catSearchTags) {
                    url += ui.item.u;
                }
                if (top !== window) {
                    parent.classFrame.location = pathtoroot + url;
                } else {
                    window.location.href = pathtoroot + url;
                }
                $("#search").focus();
            }
        }
    });
});
