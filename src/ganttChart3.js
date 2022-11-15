import * as d3 from "d3"
import * as _ from "lodash"


export function assign_event_to_row(event, last_event_per_row, settings) {
    // This funciton works because of the assumption that the events are chronologically sorted.
    // We only have to check if the beginning of the new event is before the end of the last event
    // in each row.
    for (let index = 0; index < last_event_per_row.length; ++index) {
        if (!settings.waterfall && last_event_per_row[index] <= event[settings.start_column]) {
            last_event_per_row[index] = event[settings.end_column]
            return index
        }
    }
    // if it cannot be placed in any of the existing rows we add a new row and place the event in that row.
    last_event_per_row.push(event[settings.end_column])
    return last_event_per_row.length - 1
}

export function assign_events_to_rows(events, start_row, settings) {
    //1) places each event in a row
    //2) modifies the event to hold hold the row it will be placed in. 
    let last_event_per_row = []
    for (let i = 0; i < events.length; ++i) {
        const row_placement = assign_event_to_row(events[i], last_event_per_row, settings)
        events[i].row_val = row_placement + start_row
    }
    //returns the number of rows created
    return last_event_per_row.length
}

export function get_row_count_and_assign_events_to_rows(events, groupings, settings, row_start, column, categories, filter_keys, filter_values) {
    //base case
    if (groupings.length == 0) {
        return assign_events_to_rows(events, row_start, settings)
    }
    let row_count = 0
    const filter_key = groupings.pop()
    filter_keys.push(filter_key)
    let filter_options = _.uniqBy(events, e => e[filter_key]).map(e => e[filter_key])
    for (let index = 0; index < filter_options.length; ++index) {
        let events_filtered = _.filter(events, e => e[filter_key] == filter_options[index])
        filter_values.push(filter_options[index])
        let new_rows = get_row_count_and_assign_events_to_rows(events_filtered, groupings, settings, row_count + row_start, column + 1, categories, filter_keys, filter_values)
        const category_name = filter_values[filter_values.length - 1]
        const starting_row = row_start + row_count
        const cat = new Category(category_name, starting_row, column, new_rows, filter_keys, filter_values)
        categories.push(cat)
        filter_values.pop()
        row_count += new_rows
    }
    filter_keys.pop()
    groupings.push(filter_key)
    return row_count
}

export function reformat_dates(events, settings, dateParser) {
    let ret = JSON.parse(JSON.stringify(events)) //make a deep copy
    for (let i = 0; i < events.length; ++i) {
        ret[i][settings.start_column] = dateParser(ret[i][settings.start_column])
        ret[i][settings.end_column] = dateParser(ret[i][settings.end_column])
    }
    return ret
}


//from https://stackoverflow.com/questions/3942878/how-to-decide-font-color-in-white-or-black-depending-on-background-color
// takes in a d3 color value returned by the colorscale
export function text_color_based_on_background(background_color) {
    const background_color_rgb = d3.rgb(background_color)
    const r = background_color_rgb.r
    const g = background_color_rgb.g
    const b = background_color_rgb.b
    return (r * 0.299 + g * 0.587 + b * 0.114) > 186 ? "black" : "white"
}

/* 
Depracated with new implementation
*/

export function get_groupings(settings) {
    let groupings = []
    if (settings.ech1 != null) { groupings.push(settings.ech1) }
    if (settings.ech2 != null) { groupings.push(settings.ech2) }
    if (settings.ech3 != null) { groupings.push(settings.ech3) }
    return groupings
}


export function get_timescale(events, settings, window_width, margin) {
    return d3.scaleTime()
        .domain(
            [d3.min(events, d => d[settings.start_column]),
            d3.max(events, d => d[settings.end_column])]).nice()
        .range([0, window_width - margin.right - margin.left]);
}

export function get_color_scale(row_count, settings) {
    return d3.scaleSequential()
        .domain([-1, row_count])
        .interpolator(d3[`interpolate${settings.color_scale}`])
}

export function selectable_mouseover(mouseover_event, d) {
    d3.select(mouseover_event.target).style("cursor", "pointer");//to help the user realize they can click to select
}
export function selectable_mouseout(mouseout_event, d) {
    d3.select(mouseout_event.target).style("cursor", "default");
}


/////////////internal classes                                                              
class Category {
    row_count
    name
    starting_row
    column
    filter

    constructor(cat_name, starting_row, column, row_count, filter_keys, filter_vals) {
        this.row_count = row_count
        this.name = cat_name
        this.starting_row = starting_row
        this.column = column
        this.filter = {}
        //handles the case where no filters are passed
        if (filter_keys == undefined || filter_vals == undefined) {
            this.filter == undefined
        } else {
            for (let j = 0; j < filter_keys.length; ++j) {
                this.filter[filter_keys[j]] = filter_vals[j]
            }
        }
    }

    isMatch(cat2) {
        return _.isEqual(this.filter, cat2.filter)
        return false
    }

    get row_count() { return this.row_count }
    get name() { return this.name }
    get starting_row() { return this.starting_row }
    get column() { return this.column }

    //returns the filter argument that gets passed to _.filter in order to subsort based on the events that belong to this category grouping
    //if there is no filter criteria we want all of the events to be selected.
    //a function that always returns true will accomplish this
    get filter() {
        if (this.filter == undefined) {
            return d => true
        }
        //Otherwise returning the key value mappings as defined will accomplish this. 
        return this.filter
    }
    toString() {
        return `\nName: ${this.name}\nRow Count: ${this.row_count}\nStarting Row:${this.starting_row}\nColumn: ${this.column}`
    }

}

class Row_params {
    categories;
    row_count;

    constructor(settings, events) {
        let groupings = settings.groupings
        this.categories = []
        this.row_count = get_row_count_and_assign_events_to_rows(events, groupings, settings, 0, 0, this.categories, [], [])
        //add a blank category that covers all the rows if no category present
        if (groupings.length == 0) { this.categories.push(new Category("", 0, 0, this.row_count)) }
    }

    get categories() { return this.categories }
    get row_count() { return this.row_count }
    toString() { return `Total Row Count: ${this.row_count}\nCategories:${this.categories.toString()}` }
}


class Params {
    constructor(events, settings, window_width, margin, chart_height) {
        this.column_count = settings.groupings.length > 0 ? settings.groupings.length : 1
        this.column_width = margin.left / this.column_count
        this.row_params = new Row_params(settings, events)
        this.row_height = chart_height / (this.row_params.row_count) //recalculate with stacking
        this.color_scale = get_color_scale(this.row_params.row_count, settings)
        this.time_scale = get_timescale(events, settings, window_width, margin)
    }
}


///////////////////////////Exported class

export class GanttChart {
    ///////////////////////////////////////////////////////////////////////////////////////////// settings
    duration
    window_width
    window_height
    margin  // Margin left can be shifted by the margin slider functions
    chart_height
    settings
    events_all
    events_currently_shown
    params
    svg
    selected_events
    selected_category
    date_parser



    date_parser_selection = [
        { code: d3.timeParse("%Y-%m-%d"), written: "yyyy-mm-dd" },
        { code: d3.timeParse("%m-%e-%Y"), written: "mm-dd-yyyy" },
        { code: d3.timeParse("%y-%m-%d"), written: "yy-mm-dd" },
        { code: d3.timeParse("%y-%m-%d"), written: "mm-dd-yy" },
        { code: d3.timeParse("%Y/%m/%d"), written: "yyyy/mm/dd" },
        { code: d3.timeParse("%m/%e/%Y"), written: "mm/dd/yyyy" },
        { code: d3.timeParse("%y/%m/%d"), written: "yy/mm/dd" },
        { code: d3.timeParse("%y/%m/%d"), written: "mm/dd/yy" },
        { code: d3.timeParse("%x %I:%M:%S %pz"), written: "MM/DD/YYYY hh:mm:ss A/PM" }
    ]

    sort_events_chronologically() {
        this.events_all = _.orderBy(this.events_all, [this.settings.start_column, this.settings.end_column], ['asc', 'asc'])
    }

    keep_margin_in_bounds(x) {
        let current = x
        current = current < 0 ? 0 : current
        current = current > this.window_width * .40 ? this.window_width * .40 : current
        return current
    }

    keep_filter_in_bounds(x) {
        const chart_width = this.window_width - this.margin.left - this.margin.right
        let current = x - this.margin.left
        current = current < 0 ? 0 : current
        current = current > chart_width ? chart_width : current
        return current
    }

    event_mouseover(mouseover_event, d) {
        const format = d3.timeFormat('%d %b %y')
        const start = format(d[this.settings.start_column])
        const end = format(d[this.settings.end_column])
        const label = d[this.settings.label_column] === undefined ? "" : d[this.settings.label_column]
        const details = d[this.settings.details] === undefined ? "" : d[this.settings.details]
        d3.select(".tooltip")
            .style("left", mouseover_event.pageX + 18 + "px")
            .style("top", mouseover_event.pageY + 18 + "px")
            .style("display", "block")
            .html(`Start: <strong>${start}</strong><br>
End: <strong>${end}</strong><br>
Details: <strong>${details}</strong><br>
Label: <strong>${label}</strong><br>
`);
        d3.select(mouseover_event.target).style("cursor", "pointer"); //to help the user realize they can click to select
        d3.select(mouseover_event.target)
            .attr('stroke-width', 3);
    }

    event_mouseout(mouseover_event, d) {
        // Hide tooltip on mouse out
        d3.select(".tooltip").style("display", "none"); // Hide tooltip
        d3.select(mouseover_event.target)
            .attr('stroke-width', 1)

        d3.select(mouseover_event.target).style("cursor", "default");
    }

    event_clicked(click_event, d) {
        if (this.selected_events.includes(d)) {
            const index = this.selected_events.indexOf(d)
            this.selected_events.splice(index, 1)
            d3.select(click_event.target)
                .attr("stroke", "black")
                .attr("stroke-width", 1)
        } else {
            this.selected_events.push(d)
            d3.select(click_event.target)
                .attr('stroke', 'green')
                .attr('stroke-width', 3)
        }
    }





    filter_button_clicked(click_event, d) {
        const centers = []
        d3.select(".date_filter_group").selectAll("circle").each(function () {
            centers.push(+ d3.select(this).attr("cx"))
        })
        const start_date = this.params.time_scale.invert(d3.min(centers))
        const end_date = this.params.time_scale.invert(d3.max(centers))

        this.events_currently_shown = _.filter(this.events_currently_shown, d => d[this.settings.start_column] > start_date)
        this.events_currently_shown = _.filter(this.events_currently_shown, d => d[this.settings.end_column] < end_date)
        this.update_chart()
        d3.select(".date_filter_group").selectAll("circle").remove()
        d3.select(".date_filter_group").remove()
        set_date_filter()
    }

    unfilter_button_clicked(click_event, d) {
        this.events_currently_shown = this.events_all
        if (this.selected_category != undefined) {
            this.events_currently_shown = _.filter(this.events_currently_shown, this.selected_category.filter)
        }
        update_chart()
        d3.select(".date_filter_group").selectAll("circle").remove()
        d3.select(".date_filter_group").remove()
        set_date_filter()
    }


    /* depracated
    
        set_tick_attributes(g) {
            g.selectAll(".tick")
                .attr("stroke-opacity", 0.5)
                .attr("stroke-dasharray", "2,2")
                .attr("stoke", "white")
                .attr("opacity", 1.0)
                .attr("shape-rendering", "crispEdges")
        }
    
        eliminate_grid_path(g) {
            g.selectAll("path")
                .attr("stroke-width", 0)
        }
        */


    ///////////////////////////////////////////////////////////////////////////////////////////// d3 SVG element setters
    set_x_axis() {
        let grid = this.svg.append('g')
            .attr('class', 'grid')
            .attr("transform", `translate(${this.margin.left},${this.chart_height + this.margin.top})`)
            .attr("stroke", "blue")
            .transition()
            .duration(this.duration)
            .call(
                d3.axisBottom(this.params.time_scale)
                    .ticks()
                    .tickSize(-this.chart_height)
                    .tickFormat(d3.timeFormat('%d %b %y'))
            )
            .call(g => g.selectAll(".tick")
                .attr("stroke-opacity", 0.5)
                .attr("stroke-dasharray", "2,2")
                .attr("stoke", "white")
                .attr("opacity", 1.0)
                .attr("shape-rendering", "crispEdges"))
            .call(g => g.selectAll("path")
                .attr("stroke-width", 0))
        return grid
    }

    format_axis_text(selected) {
        return selected
            .style('fill', 'black')
            .attr("stroke", "none")
            .attr("font-size", 10)
            .attr("transform", "rotate(-90)")
            .attr("text-anchor", "end")
    }

    pair_categories_to_groups() {
        return this.svg.append("g")
            .selectAll("g")
            .data(this.params.row_params.categories)
            .join("g")
            .classed("category_group", true)
    }

    set_category_rects(category_groups) {
        //This little renaming is required because "this" takes on another meaning inside of the width funciton
        const params = this.params
        const w_width = this.window_width
        const gc = this
        return category_groups.append("rect")
            .attr("x", d => d.column * this.params.column_width)
            .attr("y", d => d.starting_row * this.params.row_height + this.margin.top)
            .attr("fill", d => d3.rgb(this.params.color_scale(d.starting_row)))
            .attr("stroke", "gray")
            .attr("opacity", d => (this.params.column_count - d.column + 1) * 0.2)
            .attr("height", d => d.row_count * this.params.row_height)
            .attr("width", function (d) {
                if (d.column == params.column_count - 1) {
                    return w_width - ((params.column_count - 1) * params.column_width)
                } else {
                    return params.column_width
                }
            })
            .classed('category_rect', true)
            .on('mousemove', function (mouseover_event, d) {
                //here event refers to the mouseover event, not an event on the schedule
                d3.select(this)
                    .attr("opacity", d => (gc.params.column_count - d.column + 1) * 0.2 - 0.2)
                let filter = d.filter
                let filtered_data = _.filter(gc.events_currently_shown, filter)
                d3.selectAll(".event_rect")
                    .attr("opacity", d => filtered_data.includes(d) ? 1 : .4)
                    .attr('stroke-width', d => filtered_data.includes(d) ? 3 : 1)
                d3.select(mouseover_event.target).style("cursor", "pointer");//to help the user realize they can click to select
            })
            .on('mouseout', function (mouseout_event, d) {
                //here event refers to the mouseout event, not an event on the schedule
                d3.select(this).
                    attr("opacity", d => (gc.params.column_count - d.column + 1) * 0.2)
                d3.selectAll(".event_rect")
                    .attr("opacity", 1)
                    .attr("stroke-width", 1)
            })
            .on('click', function (click_event, d) {
                gc.events_currently_shown = gc.events_all
                if (gc.selected_category != undefined && _.isEqual(d.filter, gc.selected_category.filter)) {
                    gc.selected_category = undefined
                    gc.update_chart()
                } else {
                    gc.selected_category = d
                    const filter = d.filter
                    gc.events_currently_shown = _.filter(gc.events_currently_shown, filter)
                    gc.update_chart()
                }
            })


    }

    pair_data_to_event_groups() {
        return this.svg.append("g")
            .selectAll("g")
            .data(this.events_currently_shown)
            .join("g")
            .classed("event_group", true)
    }

    set_event_rects(event_groups) {
        const gc = this
        let event_rects = event_groups.append("rect")
            .attr("rx", 3)
            .attr("ry", 3)
            .attr("x", d => this.params.time_scale(d[this.settings.start_column]) + this.margin.left)
            .attr("y", d => d.row_val * this.params.row_height + 2 + this.margin.top)
            .attr("width", 0)
            .attr("height", this.params.row_height - 4)
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("fill", d => d3.rgb(this.params.color_scale(d.row_val)))
            .classed('event_rect', true)
            .on('mousemove', function (mouseover_event, d) {
                const format = d3.timeFormat('%d %b %y')
                const start = format(d[gc.settings.start_column])
                const end = format(d[gc.settings.end_column])
                const label = d[gc.settings.label_column] === undefined ? "" : d[gc.settings.label_column]
                const details = d[gc.settings.details] === undefined ? "" : d[gc.settings.details]
                d3.select(".tooltip").style("left", mouseover_event.pageX + 18 + "px")
                    .style("top", mouseover_event.pageY + 18 + "px")
                    .style("display", "block")
                    .html(`Start: <strong>${start}</strong><br>` +
                        `End: <strong>${end}</strong><br> ` +
                        `Details: <strong>${details}</strong><br>` +
                        `Label: <strong>${label}</strong><br>`);
                d3.select(mouseover_event.target).style("cursor", "pointer"); //to help the user realize they can click to select
                d3.select(mouseover_event.target)
                    .attr('stroke-width', 3);
            })
            .on('mouseout', function (mouseover_event, d) {
                // Hide tooltip on mouse out
                d3.select(".tooltip").style("display", "none"); // Hide tooltip
                d3.select(mouseover_event.target)
                    .attr('stroke-width', 1)

                d3.select(mouseover_event.target).style("cursor", "default");

            })
            .on("click", function (click_event, d) {
                if (gc.selected_events.includes(d)) {
                    const index = gc.selected_events.indexOf(d)
                    gc.selected_events.splice(index, 1)
                    d3.select(click_event.target)
                        .attr("stroke", "black")
                        .attr("stroke-width", 1)
                } else {
                    gc.selected_events.push(d)
                    d3.select(click_event.target)
                        .attr('stroke', 'green')
                        .attr('stroke-width', 3)
                }
            })

        event_rects
            .transition().duration(this.duration).delay(this.duration)
            .attr("width", d => (this.params.time_scale(d[this.settings.end_column]) - this.params.time_scale(d[this.settings.start_column])))
    }

    set_category_text(category_groups) {
        let category_text = category_groups.append("text")
            .text(d => d.name)
            .attr('transform', (d) => {
                let x = (d.column + .5) * this.params.column_width
                let y = d.starting_row * this.params.row_height + (d.row_count * this.params.row_height / 2) + this.margin.top
                return `translate( ${x} , ${y} ), rotate(${this.settings.category_text_rotation})`;
            })
            .attr("font-size", this.settings.category_font_size)
            .attr("alignment-baseline", "middle")
            .attr("text-anchor", "middle")
            .style("fill", d => d3.rgb(this.params.color_scale(d.starting_row)).darker())
            .attr('pointer-events', 'none') //ensures mouseover of text does not end the tooltip for the rectangle.
            .classed("category_text", true)
    }

    set_event_text(event_groups) {
        let event_text = event_groups
            .append("text")
            .text(d => d[this.settings.label_column])
            .attr('transform', (d, i) => {
                let x = this.params.time_scale(d[this.settings.start_column]) + this.margin.left  // left-side
                x += (this.params.time_scale(d[this.settings.end_column]) - this.params.time_scale(d[this.settings.start_column])) / 2 //center it
                x -= Math.round(this.settings.event_text_rotation / 45) //helps with centering small text on a rotation
                let y = (d.row_val * this.params.row_height) + (this.params.row_height / 2) + this.margin.top
                return `translate( ${x} , ${y} ), rotate(${this.settings.event_text_rotation})`;
            })
            .attr("font-size", this.settings.event_rect_font_size)
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
            .style("fill", this.settings.user_event_text_color ? this.settings.event_text_color : d => text_color_based_on_background(this.params.color_scale(d.row_val)))
            .attr("text-height", this.params.row_height)
            .attr('pointer-events', 'none') //ensures mouseover of text does not end the tooltip for the rectangle.
            .classed('event_text', true)
        return event_text
    }

    create_categories_and_events() {
        const category_groups = this.pair_categories_to_groups()
        this.set_category_rects(category_groups)
        const event_groups = this.pair_data_to_event_groups()
        this.set_event_rects(event_groups)
        this.set_category_text(category_groups)
        this.set_event_text(event_groups)
    }

    set_settings_dropdown() {
        //on hold until implementation is completed
        /*
        const button_width = 24
        const button_height = 24
        const settings_button = this.svg.append("g")
            .attr("transform", `translate(${this.window_width - this.margin.right - button_width}, 2)`)

        settings_button.append("rect")
            .attr("rx", 3)
            .attr("ry", 3)
            .attr("width", button_width)
            .attr("height", button_height)
            .attr("fill", "#fff")
            .attr("stroke", "black")
            .on("mouseover", selectable_mouseover)
            .on("mouseout", selectable_mouseout)

        settings_button.append("text")
            .html("&#9881") // when working in html files
            //   .html("&x2699;") when working in observable and maybe other platforms... tbd
            .style("font-size", 20)
            .attr("y", button_height / 2 + 2)
            .attr("x", button_width / 2)
            .attr('pointer-events', 'none')
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
            .attr('pointer-events', 'none') //ensures mouseover of text does not end the tooltip for the rectangle.
            */
    }

    set_margin_slider() {
        const gc = this
        const margin_slider_group = this.svg
            .append("g")
        margin_slider_group.classed("margin_slider_group", true)

        margin_slider_group.selectAll("circle")
            .data([this.margin.left])
            .join("circle")
            .attr("transform", `translate(0 ,${this.margin.top - 5})`)
            .attr("cy", 0)
            .attr("cx", d => d)
            .attr("r", 5)
            .attr("fill", "white")
            .attr("stroke", "black")
            .on("mouseover", selectable_mouseover)
            .on("mouseout", selectable_mouseout)
            .call(d3.drag()
                .on("start", function (event, d) { d3.select(this).raise().attr("stroke-width", 3) })
                .on("drag", function (event, d) {
                    const new_margin = gc.keep_margin_in_bounds(event.x)
                    gc.margin.left = new_margin
                    d3.select(this).raise().attr("cx", d = new_margin)
                })
                .on("end", function (event, d) {
                    d3.select(this).attr("stroke-width", 1)
                    gc.update_chart()
                }))
            .classed("slider", true)
        return margin_slider_group
    }

    set_date_filter() {
        const gc = this
        const date_filter_group = this.svg
            .append("g")
        date_filter_group.classed("date_filter_group", true)

        date_filter_group.selectAll("circle")
            .data([0, this.window_width - this.margin.left - this.margin.right])
            .join("circle")
            .attr("transform", `translate(${this.margin.left},${this.chart_height + this.margin.top + 2})`)
            .attr("cy", 0)
            .attr("cx", d => d)
            .attr("r", 5)
            .attr("fill", "white")
            .attr("stroke", "black")
            .call(d3.drag()
                .on("start", function () { d3.select(this).attr("stroke-width", 3) })
                .on("drag", function (event, d) { d3.select(this).raise().attr("cx", d = gc.keep_filter_in_bounds(event.x)) })
                .on("end", function () { d3.select(this).attr("stroke-width", 1) }))
            .on("mouseover", selectable_mouseover)
            .on("mousout", selectable_mouseout)
            .classed("pulser", true)
    }



    set_date_filter_buttons() {
        const gc = this
        const height = 20
        const width = 85
        const bottom_of_chart = this.chart_height + this.margin.top + 2 + 10

        let i = 0
        this.svg.append("rect")
            .attr("x", 5)
            .attr("y", bottom_of_chart + (height * i))
            .attr("rx", 3)
            .attr("ry", 3)
            .attr("width", width)
            .attr("height", height)
            .attr("stroke", "black")
            .attr("fill", "#eeeeee")
            .on("click", function (click_event, d) {
                const centers = []
                d3.select(".date_filter_group").selectAll("circle").each(function () {
                    centers.push(+ d3.select(this).attr("cx"))
                })
                const start_date = gc.params.time_scale.invert(d3.min(centers))
                const end_date = gc.params.time_scale.invert(d3.max(centers))

                gc.events_currently_shown = _.filter(gc.events_currently_shown, d => d[gc.settings.start_column] > start_date)
                gc.events_currently_shown = _.filter(gc.events_currently_shown, d => d[gc.settings.end_column] < end_date)
                gc.update_chart()
                d3.select(".date_filter_group").selectAll("circle").remove()
                d3.select(".date_filter_group").remove()
                gc.set_date_filter()
            })
            .on("mouseover", selectable_mouseover)
            .on("mousout", selectable_mouseout)
            .classed("pulser", true)

        this.svg.append("text")
            .text("Filter Dates")
            .attr("x", 5 + width - 2)
            .attr("y", bottom_of_chart + (height * (i + .8)))
            .attr("text-anchor", "end")
            .attr("font-size", 13)
            .attr('pointer-events', 'none')

        i = 1
        this.svg.append("rect")
            .attr("x", 5)
            .attr("y", bottom_of_chart + (height * i) + 3)
            .attr("rx", 3)
            .attr("ry", 3)
            .attr("width", width)
            .attr("height", height)
            .attr("stroke", "black")
            .attr("fill", "#eeeeee")
            .on("click", function (click_event, d) {
                gc.events_currently_shown = gc.events_all
                if (gc.selected_category != undefined) {
                    gc.events_currently_shown = _.filter(gc.events_currently_shown, gc.selected_category.filter)
                }
                gc.update_chart()
                d3.select(".date_filter_group").selectAll("circle").remove()
                d3.select(".date_filter_group").remove()
                gc.set_date_filter()
            })
            .on("mouseover", selectable_mouseover)
            .on("mousout", selectable_mouseout)
            .classed("pulser", true)

        this.svg.append("text")
            .text("Unilter Dates")
            .attr("x", 5 + width - 2)
            .attr("y", bottom_of_chart + (height * (i + .8)) + 3)
            .attr("text-anchor", "end")
            .attr("font-size", 13)
            .attr('pointer-events', 'none')
    }

    set_tooltip() {
        d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "rgba(250,250,250, 0.9)")
            .style("min_width", "30px")
            .style("max_width", "240px")
            .style("height", "auto")
            .style("border", "2px")
            .style("border", "solid")
            .style("border", "#DDD")
            .style("font-size", ".85rem")
            .style("text-align", "left")
            .style("z-index", 1000)
            .style("color", "black")
    }


    draw_chart() {
        this.params = new Params(this.events_currently_shown, this.settings, this.window_width, this.margin, this.chart_height)
        let x_axis = this.set_x_axis()
        this.set_tooltip()
        x_axis.selectAll("text")
            .call(this.format_axis_text)
        this.create_categories_and_events()
        let margin_slider = this.set_margin_slider()
        this.set_date_filter()
        this.set_settings_dropdown()
        this.set_date_filter_buttons()

    }


    update_x_axis() {
        let grid = d3.select(".grid")
            .transition().duration(this.duration)
            .attr("transform", `translate(${this.margin.left},${this.chart_height + this.margin.top})`)
            .call(
                d3.axisBottom(this.params.time_scale)
                    .ticks(10)
                    .tickSize(- this.chart_height)
                    .tickFormat(d3.timeFormat('%d %b %y'))
            )
            .call(
                g => g.selectAll(".tick")
                    .attr("stroke-opacity", 0.5)
                    .attr("stroke-dasharray", "2,2")
            )
            .call(
                g => g.selectAll("path")
                    .attr("stroke-width", 0)
            )

        return grid
    }

    remove_events_and_categories() {
        this.svg.selectAll(".category_text").remove()
        this.svg.selectAll(".event_text").remove()
        this.svg.selectAll(".event_rect").remove()
        this.svg.selectAll(".category_rect").remove()
        this.svg.selectAll(".category_group").remove()
        this.svg.selectAll(".event_group").remove()
    }



    update_chart() {
        this.remove_events_and_categories()
        this.params = new Params(this.events_currently_shown, this.settings, this.window_width, this.margin, this.chart_height)
        const x_axis = this.update_x_axis()
        x_axis.selectAll("text")
            .call(this.format_axis_text)
        this.create_categories_and_events()
    }

    update_settings() {
        // this.settings.waterfall = ...waterfall
        // this.settings.event_rect_font_size = ...eventFontSize
        // this.settings.event_text_rotation = ...eventTextRotation
        // this.settings.event_text_color = ...eventFontColor
        // this.settings.user_event_text_color = ...fontColorOverride
        // this.settings.category_font_size = ...categoryFontSize
        // this.settings.category_text_rotation = ...categoryTextRotation
    }

    update_HW(height, width) {
        this.window_width = width
        this.window_height = height
        this.chart_height = this.window_height - this.margin.bottom - this.margin.top

    }

    update_groupings(groupings) {
        this.settings.groupings = groupings
    }

    update_events(new_events) {
        this.events_all = new_events
        this.sort_events_chronologically()
        this.events_currently_shown = this.events_all
    }
    
    update_settings(new_settings){
        this.settings = new_settings
    }


    constructor(width = 1000, height = 700, transition_duration = 500, svg) {
        this.settings = { //settings hardcoded initially
            label_column: "label",
            date_format: "mm/dd/yyyy",
            start_column: "startDate",
            end_column: "endDate",
            groupings: [],
            event_text_color: "ffffff",
            user_event_text_color: false,
            event_text_rotation: 0,
            event_rect_font_size: 7,
            category_text_rotation: 0,
            category_font_size: 13,
            waterfall: false,
            color_scale: "Warm"
        }


        this.selected_events = []
        this.selected_category = undefined

        this.margin = ({ top: 30, right: 40, bottom: 60, left: (width * .2) }) // Margin left can be shifted by the margin slider functions
        this.duration = transition_duration
        this.window_width = width
        this.window_height = height
        this.chart_height = this.window_height - this.margin.bottom - this.margin.top
        // this.date_parser = _.filter(this.date_parser_selection, { 'written': this.settings.date_format })[0].code

        this.svg = svg
    }

}

export function update_HW(height, width) {
    throw new Error("Function not implemented.")
}
