interface Size {
    width: number;
    height: number;
}
interface Data {
    sizes: { [name: string]: Size };
    objects: Array<{
        size: string;
        row: number;
        column: number;
    }>;
}

window.addEventListener("load", function () {
    setup();
});

function getRandomColors() {
    const parts = ['33', '66', '99', 'CC', 'EE'];
    const result: string[] = [];
    for (var i = 0; i < 100; i++) {
        const c = '#' + p() + p() + p();
        if (result.indexOf(c) < 0) {
            result.push(c);
        }
    }

    function p() {
        return parts[Math.floor(parts.length * Math.random())];
    }
    return result;
}
const colors = getRandomColors();

type PlacedCenter = { x: number, y: number, object: any };

function inchesToFtIn(inches: number): string {
    const fracs = [[1, 2], [1, 4], [3, 4], [1, 8], [3, 8], [5, 8], [7, 8]];
    if (inches < 12) {
        return `${inches}"`;
    } else {
        const ft = Math.floor(inches / 12);
        const inch = Math.floor(inches % 12);
        const frac = inches - Math.floor(inches);
        if (frac < 0.05) {
            return `${ft}' ${inch}"`;
        } else {
            let bn = -1, bd = -1, be = 1000;
            for (const f of fracs) {
                const err = Math.abs(frac - f[0] / f[1]);
                if (err < be) {
                    bn = f[0];
                    bd = f[1];
                    be = err;
                }
            }
            return `${ft}' ${inch} ${bn}/${bd}"`;            
        }
    }
}

let lastValue = "???";
function render(text: string, plan: HTMLTextAreaElement, canvas: HTMLCanvasElement) {
    if (text === lastValue) return;
    lastValue = text;
    try {
        /// How many inches a row/column is
        const colSizeInInches = 3;
        const pixelsPerInch = 7;
        const gridSizeInInches = 3;
        // Size of canvas in pixels
        const width = 1200;
        const height = 500;
        const data = eval("(" + text + ")");

        const ctx = canvas.getContext('2d')!;
        ctx.clearRect(0, 0, width, height);
        // Horizontal gridlines
        ctx.beginPath();
        ctx.strokeStyle = '#EEEEEE';
        for (let x = 0; x < width; x += gridSizeInInches * pixelsPerInch) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
        }
        // Vertical gridlines
        for (let y = 0; y < height; y += gridSizeInInches * pixelsPerInch) {
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        ctx.stroke();

        ctx.beginPath();
        // Horizontal gridlines (foot)
        ctx.strokeStyle = '#BBBBBB';
        for (let x = 0; x < width; x += gridSizeInInches * pixelsPerInch * 4) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
        }
        // Vertical gridlines (foot)
        for (let y = 0; y < height; y += gridSizeInInches * pixelsPerInch * 4) {
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        ctx.stroke();

        ctx.font = "16pt Arial";
        let i = 1;
        const placedCenters: PlacedCenter[] = [];
        for (const obj of data.objects) {
            obj.index = i;
            const s = data.sizes[obj.size];
            const x = (obj.col + 1) * colSizeInInches * pixelsPerInch;
            const y = (obj.row + 1) * colSizeInInches * pixelsPerInch;
            const width = s.width * pixelsPerInch;
            const height = s.height * pixelsPerInch;
            placedCenters.push({
                x: (obj.col + 1) * colSizeInInches + s.width / 2,
                y: (obj.row + 1) * colSizeInInches,
                object: obj
            });
            ctx.moveTo(x, y);
            ctx.fillStyle = colors[i % colors.length];
            ctx.strokeStyle = '#444444';
            ctx.fillRect(x, y, width, height);
            ctx.strokeRect(x, y, width, height);
            ctx.strokeStyle = '#000000';
            ctx.strokeText(i.toString(), x + 30, y + 40);
            ctx.moveTo(x + width / 2, y);
            ctx.beginPath();
            ctx.arc(x + width / 2, y, pixelsPerInch / 2, 0, Math.PI * 2);
            ctx.stroke();
            i++;
        }

        const xValues: number[] = [];
        for (const p of placedCenters) {
            (xValues.indexOf(p.x) < 0) && xValues.push(p.x);
        }
        xValues.sort((a, b) => a - b);

        placedCenters.sort((a, b) => a.y - b.y);

        const planLines: string[] = [];
        for (const xv of xValues) {
            planLines.push(`At horizontal mark ${inchesToFtIn(xv)}:`)
            for (const pc of placedCenters) {
                if (pc.x === xv) {
                    planLines.push(`  * drop to ${inchesToFtIn(pc.y)} for ${pc.object.size} ${pc.object.index}`);
                }
            }
        }
        plan.value = planLines.join('\r\n');

    } catch (e) {
        console.error(e);
    }
}

function setup() {
    const input = document.getElementById('data') as HTMLTextAreaElement;
    const plan = document.getElementById('plan') as HTMLTextAreaElement;
    const cv = document.getElementById('cv') as HTMLCanvasElement;

    input.value = window.localStorage.getItem('text') || '{}';
    input.onchange = textChanged;
    window.addEventListener('keydown', e => {
        console.log(`${e.keyCode} | ${e.key}`);
        if (e.keyCode === 9) {
            e.preventDefault();
        }
    });
    window.addEventListener('keyup', e => {
        render(input.value, plan, cv);
    });

    input.addEventListener("change", function () {
        render(input.value, plan, cv);
    });

    function textChanged() {
        render(input.value, plan, cv);
        window.localStorage.setItem('text', input.value);
    }

    render(input.value, plan, cv);
}
