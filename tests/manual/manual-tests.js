describe('Promise._log()', function () {
    if (typeof console === 'undefined') {
        it('should not throw an error', function () {
            Promise._log('foo', 'warn');
        });
    } else {
        before(function () {
            sinon.spy(console, 'warn');
            sinon.spy(console, 'error');
            sinon.spy(console, 'info');
        });
        after(function () {
            console.warn.restore();
            console.error.restore();
            console.info.restore();
        });
        it('should call the native console', function () {
            Promise._log('foo', 'warn');
            Promise._log('foo', 'error');
            Promise._log('foo', 'info');

            expect(console.warn.calledOnce).to.be.ok();
            expect(console.error.calledOnce).to.be.ok();
            expect(console.info.calledOnce).to.be.ok();
        });
    }
});
