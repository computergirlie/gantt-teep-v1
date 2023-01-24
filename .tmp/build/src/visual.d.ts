import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import { GanttChart } from "./ganttChart3";
declare type Selection<T extends d3.BaseType> = d3.Selection<T, any, any, any>;
export declare class Visual implements IVisual {
    private host;
    svg: Selection<SVGElement>;
    gc: GanttChart;
    viewModel: any;
    private visualSettings;
    private formattingSettingsService;
    constructor(options: VisualConstructorOptions);
    update(options: VisualUpdateOptions): void;
    getFormattingModel(): powerbi.visuals.FormattingModel;
    convert_visual_settings(): {
        label_column: string;
        start_column: string;
        end_column: string;
        groupings: any[];
        event_text_color: string;
        user_event_text_color: boolean;
        event_text_rotation: number;
        event_rect_font_size: number;
        category_text_rotation: number;
        category_font_size: number;
        waterfall: boolean;
        mark_today: boolean;
        color_scale: powerbi.EnumMemberValue;
        padding_amount: number;
    };
}
export {};
