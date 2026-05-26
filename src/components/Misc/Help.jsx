import React, { useState } from 'react';
import { useAILevel } from '../../context/AILevelContext';
import './Help.scss';
import { Button, Offcanvas } from 'react-bootstrap';
import { zzfx } from 'zzfx';

const Help = () => {
    const { improvedAILevel } = useAILevel();
    const [show, setShow] = useState(false);
    const handleClose = () => {
        zzfx(...[0, 0, 925, 0.04, 0.3, 0.6, 1, 0.3, 0, 6.27, -184, 0.09, 0.17]);
        setShow(false);
    };
    const handleShow = () => {
        zzfx(...[0, 0, 537, 0.02, 0.02, 0.22, 1, 1.59, -6.98, 4.97]);
        setShow(true);
    };
    return (
        <>
            <Button variant="link" className="text-light" onClick={handleShow}>
                Help
            </Button>
            <Offcanvas
                className="help-offcanvas"
                show={show}
                onHide={handleClose}
                placement="end"
                backdrop
            >
                <Offcanvas.Header closeButton>
                    {improvedAILevel < 5 ? null : <Offcanvas.Title>Help</Offcanvas.Title>}
                </Offcanvas.Header>
                <Offcanvas.Body>
                    {improvedAILevel < 5 ? (
                        <>
                            <pre>BEGIN TRANSMISSION</pre>
                            <h2 className="text-warning">
                                ---- "the best QUANTUM PROCESSORS around! Then simply active the
                                auto-
                            </h2>
                            <h2 className="text-warning">.....</h2>
                            <h2 className="text-warning">....</h2>
                            <h2 className="text-warning">...</h2>
                            <h2 className="text-warning">..</h2>
                            <h2 className="text-warning">..</h2>
                            <h2 className="text-warning">.</h2>
                            <pre>RESTABLISHING CONNECTION...</pre>
                            <p>**~~--____...upgrade...**~~--____...AI...**~~--____...required...</p>
                            <pre>
                                <p>...*````~~~____.L..click...__---~~--___buy...</p>
                                <p>...*``~~~--___..R..click...**~~--____...sell...</p>
                                <p>, with your very own Basic QBiT-</p>
                                <p>......................</p>
                            </pre>
                            <pre className="">END TRANSMISSION</pre>
                        </>
                    ) : (
                        <>
                            <p>
                                Nobody knows what year it is anymore they stopped counting long ago.
                                Markets have been controlled by the same small group of traders who
                                dominate each nearby galaxy. Trade with them, acquire credits,
                                improve your AI level and stay alive long enough to buy and activate
                                5 Quantum Processors at once.
                                {/* However unbeknownst to the player at the beginning of the game, all traders are part of the secretive trading hall of legends who have already acquired the quantum trading supremacy a long time ago. In fact, they routinely speed run their way from a base starting level of 10,000 credits and 0 quantum processing power to the point of being able to generate a seemingly infinite number of credits using quantum processing power. They do this over and over again, recording the time it takes for them to reach this end game goal. */}
                            </p>
                            <p>
                                Careful while traveling between different galaxies. You don't want
                                to run into a gang of pirates or even worse a war zone, especially
                                without a shield or stealth module. Oh and there might be some
                                random events which affect the markets and sometimes the player's
                                health, fuel, AI level, shield, or stealth.
                            </p>
                            <p>
                                Whenever an item is purchased using it is automatically transported
                                to your ship by the galaxy's facilities, thats all taken care of for
                                you but you may want to buy yourself some of your own single use
                                drone couriers to reduce item delivery times but its your call.
                            </p>
                            <p>
                                During war delivery times may vary. If you travel between traders
                                within the same galaxy prices increase at a fixed rate relative to
                                the distance they are apart from one another until transmission
                                cuts. You can only sell items while traveling if you have a tractor
                                beam installed.
                            </p>
                        </>
                    )}
                </Offcanvas.Body>
            </Offcanvas>
        </>
    );
};

export default Help;
