'use strict';

var Renderer = require('../src/renderer'),
    DomRunner = require('../src/domRunner'),
    toDom = require('../src/toDom');

describe('renderer', function() {
    var runner;

    it('can take the rule to render', function() {
        var convertedText,
            renderer = Renderer.factory();

        renderer.addRule('H1, H2, H3, H4, H5, H6', function() {
            return 'markdownText';
        });

        runner = new DomRunner(toDom('<h1>test</h1>'));
        runner.next();

        convertedText = renderer.convert(runner.getNode());

        expect(convertedText).toEqual('markdownText');
    });

    it('add rules with factory', function() {
        var convertedText,
            renderer = Renderer.factory({
                'H1, H2, H3, H4, H5, H6': function() {
                    return 'markdownText';
                }
            });

        runner = new DomRunner(toDom('<h1>test</h1>'));
        runner.next();

        convertedText = renderer.convert(runner.getNode());

        expect(convertedText).toEqual('markdownText');
    });

    it('if there is no rule, conveter returns subContent', function() {
        var convertedText,
            renderer = Renderer.factory();

        runner = new DomRunner(toDom('<h1>test</h1>'));
        runner.next();

        convertedText = renderer.convert(runner.getNode(), 'subContents');

        expect(convertedText).toEqual('subContents');
    });

    it('if rule\'s converter returns falsy, conveter returns subContent', function() {
        var convertedText,
            renderer = Renderer.factory({
                'H1, H2, H3, H4, H5, H6': function() {
                    return false;
                },
                'EM': function() {}
            });

        runner = new DomRunner(toDom('<h1>test</h1>'));
        runner.next();
        convertedText = renderer.convert(runner.getNode(), 'subContents');

        expect(convertedText).toEqual('subContents');

        runner = new DomRunner(toDom('<em>test</em>'));
        runner.next();
        convertedText = renderer.convert(runner.getNode(), 'subContents');

        expect(convertedText).toEqual('subContents');
    });

    it('rules can be assigned separately with comma', function() {
        var convertedText,
            renderer = Renderer.factory({
                'H1, H2, H3, H4, H5, H6': function() {
                    return 'markdownText';
                }
            });

        runner = new DomRunner(toDom('<h2>test</h2>'));
        runner.next();

        convertedText = renderer.convert(runner.getNode());

        expect(convertedText).toEqual('markdownText');

        runner = new DomRunner(toDom('<h6>test</h6>'));
        runner.next();

        convertedText = renderer.convert(runner.getNode());

        expect(convertedText).toEqual('markdownText');
    });

    it('rules can be assigned using css style nest element', function() {
        var convertedText,
            renderer = Renderer.factory({
                'UL LI': function() {
                    return 'ulli';
                },
                'OL LI': function() {
                    return 'olli';
                }
            });

        runner = new DomRunner(toDom('<ul><li>test</li></ul>'));

        //ul을 건너띄기 위해 2번
        runner.next();
        runner.next();
        convertedText = renderer.convert(runner.getNode());
        expect(convertedText).toEqual('ulli');

        runner = new DomRunner(toDom('<ol><li>test</li></ol>'));

        //ol pass
        runner.next();
        runner.next();
        convertedText = renderer.convert(runner.getNode());
        expect(convertedText).toEqual('olli');
    });

    it('nesting rules cant apply over root element of html', function() {
        var convertedText,
            renderer = Renderer.factory({
                'DIV P': function() {
                    return 'div p';
                },
                'P': function() {
                    return 'p';
                }
            });

        runner = new DomRunner(toDom('<p></p>'));

        runner.next();
        convertedText = renderer.convert(runner.getNode());

        expect(convertedText).toEqual('p');
    });

    it('Text node uses rule name "TEXT_NODE"', function() {
        var convertedText,
            renderer = Renderer.factory({
                'TEXT_NODE': function() {
                    return 'text node';
                }
            });

        runner = new DomRunner(toDom('<p>tttt</p>'));

        runner.next();
        runner.next();
        convertedText = renderer.convert(runner.getNode());

        expect(convertedText).toEqual('text node');
    });

    it('trim() can remove space(not &nbsp), tab, new line character from string', function() {
        var renderer = Renderer.factory();

        expect(renderer.trim('aa\r\n')).toEqual('aa');
        expect(renderer.trim('\t')).toEqual('');
        expect(renderer.trim(' aa aa ')).toEqual('aa aa');
        expect(renderer.trim(toDom('<p>Hello&nbsp; </p>').firstChild.firstChild.nodeValue)).toEqual('Hello\u00a0');
    });

    it('escapeText() can process html text node for markdown text', function() {
        var renderer = Renderer.factory();

        expect(renderer.escapeText('im *text*')).toEqual('im \\*text\\*');
        expect(renderer.escapeText('im (text)')).toEqual('im \\(text\\)');
        expect(renderer.escapeText('im [text]')).toEqual('im \\[text\\]');
        expect(renderer.escapeText('im {text}')).toEqual('im \\{text\\}');
        expect(renderer.escapeText('im _text_')).toEqual('im \\_text\\_');
        expect(renderer.escapeText('im ## text')).toEqual('im \\#\\# text');
        expect(renderer.escapeText('im ` text')).toEqual('im \\` text');
        expect(renderer.escapeText('im + text -')).toEqual('im \\+ text \\-');
        expect(renderer.escapeText('im . text !')).toEqual('im \\. text \\!');
    });

    it('getSpaceControlled() can control text node spaces', function() {
        var renderer = Renderer.factory();

        runner = new DomRunner(toDom('<p>Hello <em>world</em></p>'));
        runner.next();
        runner.next();

        expect(renderer.getSpaceControlled('Hello', runner.getNode())).toEqual('Hello ');

        runner = new DomRunner(toDom('<p>Hello <em> world</em></p>'));
        runner.next();
        runner.next();

        expect(renderer.getSpaceControlled('Hello', runner.getNode())).toEqual('Hello ');

        runner = new DomRunner(toDom('<p>Hello<em> world</em></p>'));
        runner.next();
        runner.next();

        expect(renderer.getSpaceControlled('Hello', runner.getNode())).toEqual('Hello ');

        runner = new DomRunner(toDom('<p>Hello<em>&nbsp;world</em></p>'));
        runner.next();
        runner.next();

        expect(renderer.getSpaceControlled('Hello', runner.getNode())).toEqual('Hello');

        runner = new DomRunner(toDom('<p><em>Hello</em> world</p>'));
        runner.next();
        runner.next();
        runner.next();
        runner.next();

        expect(renderer.getSpaceControlled('world', runner.getNode())).toEqual(' world');
    });

    it('can mix renderers', function() {
        var renderer1, renderer2,
            PH3 = {
                tagName: 'H3',
                parentNode: {tagName: 'P'}
            },
            DIVH3 = {
                tagName: 'H3',
                parentNode: {
                    tagName: 'DIV'
                }
            },
            PDIVH3 = {
                tagName: 'H3',
                parentNode: {
                    tagName: 'DIV',
                    parentNode: {
                        tagName: 'P'
                    }
                }
            };

        renderer1 = Renderer.factory({
            'H1, H2, H3, H4, H5, H6': function() {
                return 'renderer1';
            },
            'P DIV H3': function() {
                return 'renderer1';
            },
            'DIV H3': function() {
                return 'renderer1';
            }
        });

        renderer2 = Renderer.factory({
            'H1': function() {
                return 'renderer2';
            },
            'P': function() {
                return 'renderer2';
            },
            'P DIV H3': function() {
                return 'renderer2';
            }
        });

        renderer1.mix(renderer2);

        expect(renderer1.convert({tagName: 'H1'})).toEqual('renderer2');
        expect(renderer1.convert({tagName: 'H2'})).toEqual('renderer1');
        expect(renderer1.convert({tagName: 'P'})).toEqual('renderer2');
        expect(renderer1.convert(PH3)).toEqual('renderer1');
        expect(renderer1.convert(DIVH3)).toEqual('renderer1');
        expect(renderer1.convert(PDIVH3)).toEqual('renderer2');
    });
});