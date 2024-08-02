/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/
"use strict";

import {
    select as d3Select
} from "d3-selection";

import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
//attempting the custom color add
import DataViewObjects = powerbi.DataViewObjects;
import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier;
import IColorPalette = powerbi.extensibility.IColorPalette;
//import VisualEnumerationInstanceKinds = powerbi.VisualEnumerationInstanceKinds;
//end color region
// import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
// import VisualObjectInstance = powerbi.VisualObjectInstance;
// import DataView = powerbi.DataView;
// import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import IVisualHost = powerbi.extensibility.IVisualHost;

import { GanttChart } from "./ganttChart3"
import { GeneralSettings, VisualSettingsModel } from "./settings";

import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import { color } from "d3";
import { ColorPicker, ContainerItem } from "powerbi-visuals-utils-formattingmodel/lib/FormattingSettingsComponents";
import { ColorHelper, hexToRGBString } from "powerbi-visuals-utils-colorutils";
import { toNumber } from "lodash";

// import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

type Selection<T extends d3.BaseType> = d3.Selection<T, any, any, any>;


function visualTransform(options: VisualUpdateOptions, host: IVisualHost) {
    const dataViews = options.dataViews;
    const columns = dataViews[0].table.columns
    const col_names_internal = []
    const col_names_display = []
    const rows = dataViews[0].table.rows

    const groupings = []
    for (let i = 0; i < columns.length; i++) {
        const name = Object.getOwnPropertyNames(columns[i].roles)
        col_names_display.push(columns[i].displayName)
        col_names_internal.push(name[0])
        if (name[0].includes("group")) {
            groupings.push(name[0])
        }
    }

    groupings.sort()
    const events = []
    for (let j = 0; j < rows.length; j++) {
        const row = rows[j]
        const event = {}
        for (let i = 0; i < col_names_internal.length; i++) {
            const col_name = col_names_internal[i];
            let val = row[i]
            if (col_name.includes("Date")) {
                event[col_name] = new Date(String(val))
            } else {
                event[col_name] = val
            }
        }
        events.push(event)
    }

    return {
        events: events,
        groupings: groupings,
        col_display_names: col_names_display,
        col_names_internal: col_names_internal
    }
}

export class Visual implements IVisual {
    private host: IVisualHost;
    svg: Selection<SVGElement>;
    gc: GanttChart
    viewModel
    private visualSettings: VisualSettingsModel
    private formattingSettingsService: FormattingSettingsService;
    private colorPalatte: IColorPalette;

    constructor(options: VisualConstructorOptions) {
        this.formattingSettingsService = new FormattingSettingsService();
        this.host = options.host
        this.svg = d3Select(options.element)
            .append('svg')
            .classed('ganttChart', true)
        this.gc = new GanttChart(1000, 700, 500, this.svg)
        this.colorPalatte = options.host.colorPalette;
        options.element.style.overflow = 'auto';
        console.log('Visual Constructor', options)
    }

    public update(options: VisualUpdateOptions) {
        console.log('Visual Update', options)
        const x: number = options.dataViews[0].table.rows.length; //the aim here is to be a setting for the calculation so the user can custom size the row
        const width: number = options.viewport.width;
        const maxheight: number = x+50;  //this is a default and should now be user defined. 
        this.svg.attr("width", width);
        this.svg.attr("height", maxheight);
        if (!options || !options.dataViews || !options.dataViews[0]) {
            return;
        }

        this.viewModel = visualTransform(options, this.host);
        
        //clear existing plot
        this.svg.selectChildren().remove()
        
        this.visualSettings = this.formattingSettingsService.populateFormattingSettingsModel(VisualSettingsModel, options.dataViews);

        const new_settings = this.convert_visual_settings()

        this.gc.update_settings(new_settings)
        this.gc.selected_category = undefined
        //acollins - 7/31/24: this line deployed to make the categorical heights work and scroll attractively
        let event_height = x * toNumber(this.visualSettings.event.eventHeight.value);
        //acollins - 7/31/24: this line deployed to re-do the height so that the svg is correct.  May need some tweaking later
        this.svg.attr("height", event_height+50)
       
        this.gc.update_HW(event_height, width)
        this.gc.update_col_display_names(this.viewModel.col_display_names)
        this.gc.update_internal_col_names(this.viewModel.col_names_internal)

        this.gc.update_events(this.viewModel.events)
        this.gc.update_groupings(this.viewModel.groupings)
        
        this.gc.draw_chart()
       
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.visualSettings);
    }

    public convert_visual_settings() {

        const catetgory_settings = this.visualSettings.category
        const event_settings = this.visualSettings.event
        const general_settings = this.visualSettings.general
        let color_scale = general_settings.colorScheme.value.value
               if (general_settings.grayScale.value)
        { //maybe cut later we will see
            color_scale = "Greys"
        }
        //8/2/24 - acollins: for some reason just calling general_settings was REFUSING to set the color properly.  This line fixes it
        let customColor2 = this.visualSettings.general.customColor.value.value
        let _colorSchemeOverride = general_settings.colorSchemeOverride.value
        const padding_amount_val = Math.max(0, this.visualSettings.event.paddingAmount.value)
        const padding_type_val = parseInt(String(this.visualSettings.event.paddingType.value.value))
       
        return {
            label_column: "label",
            start_column: "startDate",
            end_column: "endDate",
            groupings: [],
            event_text_color: event_settings.eventFontColor.value.value,
            user_event_text_color: event_settings.fontColorOverride.value,
            event_text_rotation: parseInt(String(event_settings.eventTextRotation.value.value)),
            event_rect_font_size: event_settings.eventFontSize.value,
            category_text_rotation: parseInt(String(catetgory_settings.categoryTextRotation.value.value)),
            category_font_size: Math.max(0, catetgory_settings.categoryFontSize.value),
            waterfall: event_settings.waterfall.value,
            mark_today: general_settings.markCurrentDay.value,
            color_scale: color_scale,
            padding_amount: padding_amount_val * padding_type_val,
            customColor: customColor2, //8/2/24 - acollins: setting the actual setting inside so gantt chart can use it. 
            colorSchemeOverride: _colorSchemeOverride,
            event_height: event_settings.eventHeight.value
        }
    }
}